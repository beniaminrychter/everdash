import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isIPv4 } from 'node:net';
import { join } from 'node:path';
import type { DevicesOverview, RegisteredDevice } from '@everdash/contracts/auth/devices';
import {
  AtomicJsonDurabilityError,
  ensurePrivateDirectory,
  writeAtomicJson,
} from '../persistence/atomic-json';
import { resolveIpv4FromNeighborTable } from './neighbor-ip';

interface LegacyAccessState {
  key: string;
  generation: number;
  salt: string | null;
  hash: string | null;
  unresolved: boolean;
}

interface AccessState {
  version: 2;
  key: string;
  registrationCode: string;
  codeCreatedAt: number;
  devices: RegisteredDevice[];
}

export interface TabletAccessOptions {
  resolveIpv4?: (ip: string) => string | null;
}

const CODE_PATTERN = /^[0-9]{6}$/;
const HEX_32 = /^[a-f0-9]{32}$/;
const HEX_64 = /^[a-f0-9]{64}$/;
const DEVICE_TYPE_PATTERN = /^[A-Za-z0-9 ._-]{1,40}$/;
const SCREEN_SIZE_PATTERN = /^(\d{2,5})\s*[×x]\s*(\d{2,5})$/i;
const LAST_SEEN_PERSIST_INTERVAL_MS = 5 * 60_000;

function generateRegistrationCode(excluding?: string): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = randomInt(0, 1_000_000).toString().padStart(6, '0');
    if (candidate !== excluding) {
      return candidate;
    }
  }
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function normalizeIpAddress(
  raw: string | undefined,
  resolveIpv4: (ip: string) => string | null = resolveIpv4FromNeighborTable,
): string {
  if (!raw) {
    return 'Unknown';
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'Unknown';
  }
  if (trimmed.startsWith('::ffff:')) {
    const mapped = trimmed.slice(7);
    if (isIPv4(mapped)) {
      return mapped;
    }
  }
  if (trimmed === '::1') {
    return '127.0.0.1';
  }
  if (isIPv4(trimmed)) {
    return trimmed;
  }
  const resolved = resolveIpv4(trimmed);
  if (resolved && isIPv4(resolved)) {
    return resolved;
  }
  return 'Unknown';
}

export function inferDeviceTypeFromUserAgent(ua = ''): string {
  if (/iPad/i.test(ua)) {
    return 'iPad';
  }
  if (/iPhone/i.test(ua)) {
    return 'iPhone';
  }
  if (/iPod/i.test(ua)) {
    return 'iPod';
  }
  if (/Android/i.test(ua)) {
    return /Mobile/i.test(ua) ? 'Android phone' : 'Android tablet';
  }
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return 'Mac';
  }
  if (/Windows/i.test(ua)) {
    return 'Windows PC';
  }
  if (/CrOS/i.test(ua)) {
    return 'Chromebook';
  }
  if (/Linux/i.test(ua)) {
    return 'Linux';
  }
  return 'Browser';
}

function sanitizeDeviceType(raw: unknown, userAgent: string | undefined): string {
  if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/\s+/g, ' ');
    if (DEVICE_TYPE_PATTERN.test(cleaned)) {
      return cleaned;
    }
  }
  return inferDeviceTypeFromUserAgent(userAgent);
}

function sanitizeScreenSize(raw: unknown): string {
  if (typeof raw === 'string') {
    const match = SCREEN_SIZE_PATTERN.exec(raw.trim());
    if (match) {
      const width = Number(match[1]);
      const height = Number(match[2]);
      if (width > 0 && height > 0) {
        return `${width} × ${height}`;
      }
    }
  }
  return 'Unknown';
}

function isValidDevice(candidate: unknown): candidate is RegisteredDevice {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }
  const device = candidate as Partial<RegisteredDevice>;
  return (
    typeof device.id === 'string' &&
    HEX_32.test(device.id) &&
    typeof device.name === 'string' &&
    device.name.length <= 80 &&
    typeof device.ip === 'string' &&
    device.ip.length > 0 &&
    device.ip.length <= 64 &&
    typeof device.deviceType === 'string' &&
    device.deviceType.length > 0 &&
    device.deviceType.length <= 40 &&
    typeof device.screenSize === 'string' &&
    device.screenSize.length > 0 &&
    device.screenSize.length <= 32 &&
    Number.isSafeInteger(device.registeredAt) &&
    Number.isSafeInteger(device.lastSeenAt)
  );
}

function isLegacyState(candidate: unknown): candidate is LegacyAccessState {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }
  const value = candidate as Partial<LegacyAccessState>;
  return (
    typeof value.key === 'string' &&
    HEX_64.test(value.key) &&
    Number.isSafeInteger(value.generation) &&
    typeof value.unresolved === 'boolean' &&
    ((value.salt === null && value.hash === null) ||
      (typeof value.salt === 'string' &&
        HEX_32.test(value.salt) &&
        typeof value.hash === 'string' &&
        /^[a-f0-9]{128}$/.test(value.hash)))
  );
}

export class TabletAccess {
  private readonly observedIpv6 = new Map<string, string>();
  private readonly resolveIpv4: (ip: string) => string | null;

  private constructor(
    private readonly path: string,
    private state: AccessState,
    options: TabletAccessOptions = {},
  ) {
    this.resolveIpv4 = options.resolveIpv4 ?? resolveIpv4FromNeighborTable;
    for (const device of state.devices) {
      if (!isIPv4(device.ip) && device.ip !== 'Unknown') {
        this.observedIpv6.set(device.id, device.ip);
      }
    }
  }

  static async open(directory: string, options: TabletAccessOptions = {}): Promise<TabletAccess> {
    ensurePrivateDirectory(directory);
    const path = join(directory, 'tablet-access.json');
    if (existsSync(path)) {
      const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid tablet access settings');
      }
      const value = parsed as Partial<AccessState>;
      if (value.version === 2) {
        if (
          typeof value.key !== 'string' ||
          !HEX_64.test(value.key) ||
          typeof value.registrationCode !== 'string' ||
          !CODE_PATTERN.test(value.registrationCode) ||
          !Number.isSafeInteger(value.codeCreatedAt) ||
          !Array.isArray(value.devices) ||
          !value.devices.every(isValidDevice)
        ) {
          throw new Error('Invalid tablet access settings');
        }
        return new TabletAccess(path, value as AccessState, options);
      }
      if (isLegacyState(parsed)) {
        const migrated: AccessState = {
          version: 2,
          key: parsed.key,
          registrationCode: generateRegistrationCode(),
          codeCreatedAt: Date.now(),
          devices: [],
        };
        writeAtomicJson(path, migrated);
        return new TabletAccess(path, migrated, options);
      }
      throw new Error('Invalid tablet access settings');
    }

    const initial: AccessState = {
      version: 2,
      key: randomBytes(32).toString('hex'),
      registrationCode: generateRegistrationCode(),
      codeCreatedAt: Date.now(),
      devices: [],
    };
    writeAtomicJson(path, initial);
    return new TabletAccess(path, initial, options);
  }

  private persist(nextState: AccessState): void {
    try {
      writeAtomicJson(this.path, nextState);
    } catch (error) {
      if (error instanceof AtomicJsonDurabilityError) {
        this.state = nextState;
      }
      throw error;
    }
    this.state = nextState;
  }

  status(session?: string): 'registered' | 'registration_required' {
    if (session && this.authorized(session)) {
      return 'registered';
    }
    return 'registration_required';
  }

  overview(): DevicesOverview {
    let upgraded = false;
    const nextDevices = this.state.devices.map((device) => {
      if (isIPv4(device.ip)) {
        return device;
      }
      const candidate =
        this.observedIpv6.get(device.id) ?? (device.ip !== 'Unknown' ? device.ip : undefined);
      const resolved = candidate ? normalizeIpAddress(candidate, this.resolveIpv4) : 'Unknown';
      if (resolved !== 'Unknown') {
        this.observedIpv6.delete(device.id);
        upgraded = true;
        return { ...device, ip: resolved };
      }
      return device;
    });
    if (upgraded) {
      try {
        this.persist({ ...this.state, devices: nextDevices });
      } catch {
        // Overview upgrades are best-effort.
      }
    }
    return {
      registrationCode: this.state.registrationCode,
      codeCreatedAt: this.state.codeCreatedAt,
      devices: [...this.state.devices]
        .sort((left, right) => right.registeredAt - left.registeredAt)
        .map((device) => ({
          ...device,
          ip: isIPv4(device.ip) ? device.ip : 'Unknown',
        })),
    };
  }

  regenerateCode(): { registrationCode: string; codeCreatedAt: number } {
    const registrationCode = generateRegistrationCode(this.state.registrationCode);
    const codeCreatedAt = Date.now();
    this.persist({
      ...this.state,
      registrationCode,
      codeCreatedAt,
    });
    return { registrationCode, codeCreatedAt };
  }

  registerDevice(
    code: string,
    metadata: {
      ip?: string;
      deviceType?: unknown;
      screenSize?: unknown;
      userAgent?: string;
    } = {},
  ): { device: RegisteredDevice; session: string } | null {
    if (!CODE_PATTERN.test(code)) {
      return null;
    }
    const provided = Buffer.from(code, 'utf8');
    const expected = Buffer.from(this.state.registrationCode, 'utf8');
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }
    const now = Date.now();
    const id = randomBytes(16).toString('hex');
    const ip = normalizeIpAddress(metadata.ip, this.resolveIpv4);
    if (ip === 'Unknown' && metadata.ip?.trim().includes(':')) {
      this.observedIpv6.set(id, metadata.ip.trim());
    }
    const device: RegisteredDevice = {
      id,
      name: '',
      ip,
      deviceType: sanitizeDeviceType(metadata.deviceType, metadata.userAgent),
      screenSize: sanitizeScreenSize(metadata.screenSize),
      registeredAt: now,
      lastSeenAt: now,
    };
    const nextCode = generateRegistrationCode(this.state.registrationCode);
    this.persist({
      ...this.state,
      registrationCode: nextCode,
      codeCreatedAt: now,
      devices: [...this.state.devices, device],
    });
    const nonce = randomBytes(16).toString('hex');
    const payload = `${device.id}.${nonce}`;
    const signature = createHmac('sha256', this.state.key).update(payload).digest('hex');
    return {
      device: { ...device },
      session: `${payload}.${signature}`,
    };
  }

  private findAuthorizedDevice(session: string): RegisteredDevice | null {
    const parts = session.split('.');
    if (
      parts.length !== 3 ||
      !HEX_32.test(parts[0]) ||
      !HEX_32.test(parts[1]) ||
      !HEX_64.test(parts[2])
    ) {
      return null;
    }
    const signature = createHmac('sha256', this.state.key)
      .update(`${parts[0]}.${parts[1]}`)
      .digest();
    if (!timingSafeEqual(signature, Buffer.from(parts[2], 'hex'))) {
      return null;
    }
    return this.state.devices.find((device) => device.id === parts[0]) ?? null;
  }

  authorized(session: string): boolean {
    return this.findAuthorizedDevice(session) !== null;
  }

  touchSession(session: string, ip?: string): void {
    const existing = this.findAuthorizedDevice(session);
    if (!existing) {
      return;
    }
    const normalizedIp = normalizeIpAddress(ip, this.resolveIpv4);
    let nextIp: string;
    if (normalizedIp !== 'Unknown') {
      nextIp = normalizedIp;
      this.observedIpv6.delete(existing.id);
    } else if (isIPv4(existing.ip)) {
      nextIp = existing.ip;
    } else {
      nextIp = 'Unknown';
      if (ip?.trim().includes(':')) {
        this.observedIpv6.set(existing.id, ip.trim());
      }
    }
    const now = Date.now();
    const ipChanged = nextIp !== existing.ip;
    const staleLastSeen = now - existing.lastSeenAt >= LAST_SEEN_PERSIST_INTERVAL_MS;
    if (!ipChanged && !staleLastSeen) {
      return;
    }
    const devices = this.state.devices.map((device) =>
      device.id === existing.id ? { ...device, ip: nextIp, lastSeenAt: now } : device,
    );
    try {
      this.persist({ ...this.state, devices });
    } catch {
      // Touch updates are best-effort; avoid failing dashboard reads on durability errors.
    }
  }

  renameDevice(id: string, name: string): RegisteredDevice | null {
    if (!HEX_32.test(id)) {
      return null;
    }
    const cleanedName = name.trim().replace(/\s+/g, ' ').slice(0, 80);
    const index = this.state.devices.findIndex((device) => device.id === id);
    if (index === -1) {
      return null;
    }
    const updated: RegisteredDevice = {
      ...this.state.devices[index],
      name: cleanedName,
    };
    const devices = [...this.state.devices];
    devices[index] = updated;
    this.persist({ ...this.state, devices });
    return { ...updated };
  }

  removeDevice(id: string): boolean {
    if (!HEX_32.test(id)) {
      return false;
    }
    const devices = this.state.devices.filter((device) => device.id !== id);
    if (devices.length === this.state.devices.length) {
      return false;
    }
    this.observedIpv6.delete(id);
    this.persist({ ...this.state, devices });
    return true;
  }

  removeDeviceBySession(session: string): boolean {
    const device = this.findAuthorizedDevice(session);
    if (!device) {
      return false;
    }
    return this.removeDevice(device.id);
  }
}
