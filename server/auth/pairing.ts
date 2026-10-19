import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { DeviceRepository } from './devices';
import { SlidingWindowRateLimiter } from './rate-limit';
import { PairingError } from './errors';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PAIRING_WINDOW_MS = 5 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;

interface PairingRecord {
  requestId: string;
  codeDigest: string;
  pollSecretDigest: string;
  expiresAt: number;
  state: 'pending' | 'approved' | 'redeemed';
  label?: string;
  deviceId?: string;
}

export interface PairingServiceOptions {
  devices: DeviceRepository;
  now?: () => number;
  limiter?: SlidingWindowRateLimiter;
  maxPending?: number;
}

export type PairingStatus =
  | { status: 'pending' }
  | { status: 'expired' }
  | { status: 'approved'; deviceId: string; session: string };

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function digestMatches(value: string, expectedDigest: string): boolean {
  const actual = Buffer.from(digest(value), 'hex');
  const expected = Buffer.from(expectedDigest, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function createCode(): string {
  return Array.from(randomBytes(8), (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

export class PairingService {
  private readonly requests = new Map<string, PairingRecord>();
  private readonly now: () => number;
  private readonly limiter: SlidingWindowRateLimiter;
  private readonly maxPending: number;

  constructor(private readonly options: PairingServiceOptions) {
    this.now = options.now ?? Date.now;
    this.limiter = options.limiter ?? new SlidingWindowRateLimiter({ now: this.now });
    this.maxPending = options.maxPending ?? 100;
  }

  create(peerIp: string) {
    this.consume(`create:${peerIp}`, 5);
    this.pruneExpired();
    const pendingCount = [...this.requests.values()].filter(
      (request) => request.state !== 'redeemed',
    ).length;
    if (pendingCount >= this.maxPending) {
      throw new PairingError('Too many pairing requests are pending.', 'PAIRING_CAPACITY');
    }

    let code = createCode();
    let codeDigest = digest(code);
    while ([...this.requests.values()].some((request) => request.codeDigest === codeDigest)) {
      code = createCode();
      codeDigest = digest(code);
    }
    const requestId = randomBytes(16).toString('base64url');
    const pollSecret = randomBytes(32).toString('base64url');
    const expiresAt = this.now() + PAIRING_WINDOW_MS;
    this.requests.set(requestId, {
      requestId,
      codeDigest,
      pollSecretDigest: digest(pollSecret),
      expiresAt,
      state: 'pending',
    });
    return { requestId, code, expiresAt, pollSecret };
  }

  async approve(userId: string, rawCode: string, rawLabel: string): Promise<void> {
    this.consume(`approve:${userId}`, 10);
    const code = rawCode.trim().toUpperCase();
    const label = rawLabel.trim();
    if (!label || label.length > 80) {
      throw new PairingError(
        'Device label must contain 1 to 80 characters.',
        'PAIRING_LABEL_INVALID',
      );
    }
    this.pruneExpired();
    const record = [...this.requests.values()].find(
      (candidate) => candidate.state === 'pending' && digestMatches(code, candidate.codeDigest),
    );
    if (!record) {
      throw new PairingError('Pairing code was not found or has expired.', 'PAIRING_NOT_FOUND');
    }
    record.state = 'approved';
    record.label = label;
  }

  async status(requestId: string, pollSecret: string): Promise<PairingStatus> {
    this.consume(`poll:${requestId}`, 30);
    const record = this.requests.get(requestId);
    if (!record) {
      return { status: 'expired' };
    }
    if (!digestMatches(pollSecret, record.pollSecretDigest)) {
      throw new PairingError('Pairing poll secret is invalid.', 'PAIRING_POLL_DENIED');
    }
    if (record.expiresAt <= this.now()) {
      this.requests.delete(requestId);
      return { status: 'expired' };
    }
    if (record.state === 'pending') {
      return { status: 'pending' };
    }
    if (record.state === 'redeemed') {
      throw new PairingError('Pairing approval has already been redeemed.', 'PAIRING_REDEEMED');
    }

    const session = randomBytes(32).toString('base64url');
    const device = await this.options.devices.add(record.label ?? 'Tablet', session);
    record.state = 'redeemed';
    record.deviceId = device.id;
    return { status: 'approved', deviceId: device.id, session };
  }

  private consume(key: string, limit: number) {
    const result = this.limiter.consume(key, limit, RATE_WINDOW_MS);
    if (!result.allowed) {
      throw new PairingError(
        'Too many requests. Retry later.',
        'RATE_LIMITED',
        result.retryAfterSeconds,
      );
    }
  }

  private pruneExpired() {
    const now = this.now();
    for (const [requestId, request] of this.requests) {
      if (request.expiresAt <= now || request.state === 'redeemed') {
        this.requests.delete(requestId);
      }
    }
  }
}
