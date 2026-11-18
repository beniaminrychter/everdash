import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isIPv4 } from 'node:net';

export interface NeighborEntry {
  ip: string;
  mac: string;
  iface?: string;
}

const NEIGHBOR_CACHE_TTL_MS = 5_000;
const COMMAND_TIMEOUT_MS = 300;
const LINUX_IP_BINARIES = ['ip', '/sbin/ip', '/usr/sbin/ip'];

let cachedEntries: NeighborEntry[] = [];
let cachedAt = 0;

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function isPrivateLanIpv4(ip: string): boolean {
  if (!isIPv4(ip)) {
    return false;
  }
  const value = ipv4ToInt(ip);
  const first = (value >>> 24) & 0xff;
  const second = (value >>> 16) & 0xff;
  if (first === 10) {
    return true;
  }
  if (first === 172 && second >= 16 && second <= 31) {
    return true;
  }
  return first === 192 && second === 168;
}

function isUsableIpv4(ip: string): boolean {
  if (!isIPv4(ip)) {
    return false;
  }
  const value = ipv4ToInt(ip);
  const first = (value >>> 24) & 0xff;
  const second = (value >>> 16) & 0xff;
  if (first === 0 || first === 127 || first >= 224) {
    return false;
  }
  return !(first === 169 && second === 254);
}

export function normalizeMac(raw: string): string | null {
  const parts = raw.trim().toLowerCase().split(/[:-]/);
  if (parts.length !== 6) {
    return null;
  }
  const normalized: string[] = [];
  for (const part of parts) {
    if (!/^[0-9a-f]{1,2}$/.test(part)) {
      return null;
    }
    normalized.push(part.padStart(2, '0'));
  }
  const mac = normalized.join(':');
  if (mac === '00:00:00:00:00:00' || mac === 'ff:ff:ff:ff:ff:ff') {
    return null;
  }
  const firstOctet = Number.parseInt(normalized[0]!, 16);
  if ((firstOctet & 1) === 1) {
    return null;
  }
  return mac;
}

function parseIpv6Groups(segment: string): string[] | null {
  if (!segment) {
    return [];
  }
  const items = segment.split(':');
  const groups: string[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]!;
    if (index === items.length - 1 && isIPv4(item)) {
      const value = ipv4ToInt(item);
      groups.push(
        ((value >>> 16) & 0xffff).toString(16).padStart(4, '0'),
        (value & 0xffff).toString(16).padStart(4, '0'),
      );
      continue;
    }
    if (!/^[0-9a-fA-F]{1,4}$/.test(item)) {
      return null;
    }
    groups.push(item.toLowerCase().padStart(4, '0'));
  }
  return groups;
}

export function canonicalizeIpv6(raw: string): { canonical: string; zone?: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const zoneIndex = trimmed.indexOf('%');
  const addressPart = zoneIndex === -1 ? trimmed : trimmed.slice(0, zoneIndex);
  const zone = zoneIndex === -1 ? undefined : trimmed.slice(zoneIndex + 1).trim() || undefined;
  if (!addressPart.includes(':')) {
    return null;
  }

  const doubleColonParts = addressPart.split('::');
  if (doubleColonParts.length > 2) {
    return null;
  }

  const left = parseIpv6Groups(doubleColonParts[0] ?? '');
  if (!left) {
    return null;
  }

  if (doubleColonParts.length === 1) {
    if (left.length !== 8) {
      return null;
    }
    return { canonical: left.join(':'), zone };
  }

  const right = parseIpv6Groups(doubleColonParts[1] ?? '');
  if (!right) {
    return null;
  }
  const missing = 8 - left.length - right.length;
  if (missing < 1) {
    return null;
  }
  return {
    canonical: [...left, ...Array.from({ length: missing }, () => '0000'), ...right].join(':'),
    zone,
  };
}

export function parseLinuxIpNeigh(output: string): NeighborEntry[] {
  const entries: NeighborEntry[] = [];
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const tokens = trimmed.split(/\s+/);
    const ip = tokens[0];
    if (!ip || tokens.includes('FAILED') || tokens.includes('INCOMPLETE')) {
      continue;
    }
    const devIndex = tokens.indexOf('dev');
    const lladdrIndex = tokens.indexOf('lladdr');
    const macRaw = lladdrIndex !== -1 ? tokens[lladdrIndex + 1] : undefined;
    const mac = macRaw ? normalizeMac(macRaw) : null;
    if (!mac) {
      continue;
    }
    const iface = devIndex !== -1 ? tokens[devIndex + 1] : undefined;
    entries.push({ ip, mac, iface });
  }
  return entries;
}

export function parseLinuxProcArp(output: string): NeighborEntry[] {
  const entries: NeighborEntry[] = [];
  const lines = output.split(/\r?\n/).slice(1);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 6) {
      continue;
    }
    const [ip, , flags, macRaw, , iface] = tokens;
    if (!ip || !isIPv4(ip) || flags === '0x0' || !macRaw) {
      continue;
    }
    const mac = normalizeMac(macRaw);
    if (!mac) {
      continue;
    }
    entries.push({ ip, mac, iface });
  }
  return entries;
}

export function parseMacNdp(output: string): NeighborEntry[] {
  const entries: NeighborEntry[] = [];
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('Neighbor')) {
      continue;
    }
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 3) {
      continue;
    }
    const [ip, macRaw, iface] = tokens;
    if (!ip || !macRaw || macRaw === '(incomplete)') {
      continue;
    }
    const mac = normalizeMac(macRaw);
    if (!mac) {
      continue;
    }
    entries.push({ ip, mac, iface });
  }
  return entries;
}

export function parseMacArp(output: string): NeighborEntry[] {
  const entries: NeighborEntry[] = [];
  for (const line of output.split(/\r?\n/)) {
    const match = /\(([^)]+)\)\s+at\s+([0-9a-fA-F:]+)\s+on\s+(\S+)/.exec(line);
    if (!match) {
      continue;
    }
    const [, ip, macRaw, iface] = match;
    if (!ip || !isIPv4(ip) || !macRaw) {
      continue;
    }
    const mac = normalizeMac(macRaw);
    if (!mac) {
      continue;
    }
    entries.push({ ip, mac, iface });
  }
  return entries;
}

export function resolveIpv4FromNeighbors(
  ipv6Raw: string,
  entries: readonly NeighborEntry[],
): string | null {
  const target = canonicalizeIpv6(ipv6Raw);
  if (!target) {
    return null;
  }

  const macMatches: { mac: string; sameIface: boolean }[] = [];
  for (const entry of entries) {
    const parsed = canonicalizeIpv6(entry.ip);
    if (!parsed || parsed.canonical !== target.canonical) {
      continue;
    }
    const entryIface = entry.iface ?? parsed.zone;
    const sameIface = Boolean(target.zone && entryIface && entryIface === target.zone);
    macMatches.push({ mac: entry.mac, sameIface });
  }

  if (macMatches.length === 0) {
    return null;
  }

  let bestIp: string | null = null;
  let bestScore = -1;

  for (const entry of entries) {
    if (!isUsableIpv4(entry.ip)) {
      continue;
    }
    const macMatch = macMatches.find((candidate) => candidate.mac === entry.mac);
    if (!macMatch) {
      continue;
    }
    const sameIface =
      macMatch.sameIface || Boolean(target.zone && entry.iface && entry.iface === target.zone);
    const score = (sameIface ? 4 : 0) + (isPrivateLanIpv4(entry.ip) ? 2 : 1);
    if (score > bestScore) {
      bestScore = score;
      bestIp = entry.ip;
    }
  }

  return bestIp;
}

function readCommand(command: string, args: string[]): string | null {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      timeout: COMMAND_TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

function readLinuxNeighbors(): NeighborEntry[] {
  const entries: NeighborEntry[] = [];
  try {
    entries.push(...parseLinuxProcArp(readFileSync('/proc/net/arp', 'utf8')));
  } catch {
    // /proc/net/arp may not be readable in restricted environments.
  }
  for (const binary of LINUX_IP_BINARIES) {
    const output = readCommand(binary, ['neigh', 'show']);
    if (output !== null) {
      entries.push(...parseLinuxIpNeigh(output));
      break;
    }
  }
  return entries;
}

function readMacNeighbors(): NeighborEntry[] {
  const entries: NeighborEntry[] = [];
  const ndpOutput = readCommand('ndp', ['-an']);
  if (ndpOutput !== null) {
    entries.push(...parseMacNdp(ndpOutput));
  }
  const arpOutput = readCommand('arp', ['-an']);
  if (arpOutput !== null) {
    entries.push(...parseMacArp(arpOutput));
  }
  return entries;
}

function readHostNeighbors(): NeighborEntry[] {
  if (process.platform === 'linux') {
    return readLinuxNeighbors();
  }
  if (process.platform === 'darwin') {
    return readMacNeighbors();
  }
  return [];
}

export function resolveIpv4FromNeighborTable(ipv6Raw: string, now = Date.now()): string | null {
  if (now - cachedAt >= NEIGHBOR_CACHE_TTL_MS) {
    cachedEntries = readHostNeighbors();
    cachedAt = now;
  }
  return resolveIpv4FromNeighbors(ipv6Raw, cachedEntries);
}
