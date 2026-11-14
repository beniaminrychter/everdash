import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import {
  AtomicJsonDurabilityError,
  ensurePrivateDirectory,
  writeAtomicJson,
} from '../persistence/atomic-json';

const scrypt = promisify(scryptCallback);
interface AccessState {
  key: string;
  generation: number;
  salt: string | null;
  hash: string | null;
  unresolved: boolean;
}

export class TabletAccess {
  private constructor(
    private readonly path: string,
    private state: AccessState,
  ) {}

  static async open(directory: string): Promise<TabletAccess> {
    ensurePrivateDirectory(directory);
    const path = join(directory, 'tablet-access.json');
    if (existsSync(path)) {
      const state: unknown = JSON.parse(readFileSync(path, 'utf8'));
      if (!state || typeof state !== 'object') {
        throw new Error('Invalid tablet access settings');
      }
      const value = state as AccessState;
      if (
        !/^[a-f0-9]{64}$/.test(value.key) ||
        !Number.isSafeInteger(value.generation) ||
        typeof value.unresolved !== 'boolean' ||
        !(
          (value.salt === null && value.hash === null) ||
          (typeof value.salt === 'string' &&
            /^[a-f0-9]{32}$/.test(value.salt) &&
            typeof value.hash === 'string' &&
            /^[a-f0-9]{128}$/.test(value.hash))
        )
      ) {
        throw new Error('Invalid tablet access settings');
      }
      return new TabletAccess(path, value);
    }
    const value: AccessState = {
      key: randomBytes(32).toString('hex'),
      generation: 0,
      salt: null,
      hash: null,
      unresolved:
        existsSync(join(directory, 'dashboard.json')) ||
        existsSync(join(directory, 'dashboard.previous.json')),
    };
    writeAtomicJson(path, value);
    return new TabletAccess(path, value);
  }

  status(): 'open' | 'pin_required' | 'setup_required' {
    if (this.state.unresolved) {
      return 'setup_required';
    }
    return this.state.hash ? 'pin_required' : 'open';
  }

  async setPin(pin: string | null): Promise<void> {
    if (pin !== null && !/^[0-9]{4,6}$/.test(pin)) {
      throw new Error('PIN must contain four to six digits');
    }
    const salt = pin === null ? null : randomBytes(16).toString('hex');
    const hash =
      pin === null || salt === null
        ? null
        : ((await scrypt(pin, salt, 64)) as Buffer).toString('hex');
    const state = {
      ...this.state,
      generation: this.state.generation + 1,
      salt,
      hash,
      unresolved: false,
    };
    try {
      writeAtomicJson(this.path, state);
    } catch (error) {
      if (error instanceof AtomicJsonDurabilityError) {
        this.state = state;
      }
      throw error;
    }
    this.state = state;
  }

  async unlock(pin: string): Promise<string | null> {
    if (
      !/^[0-9]{4,6}$/.test(pin) ||
      !this.state.salt ||
      !this.state.hash ||
      this.state.unresolved
    ) {
      return null;
    }
    const snapshot = this.state;
    const derived = (await scrypt(pin, snapshot.salt as string, 64)) as Buffer;
    const expected = Buffer.from(snapshot.hash as string, 'hex');
    if (snapshot !== this.state) {
      return null;
    }
    if (!timingSafeEqual(derived, expected)) {
      return null;
    }
    const nonce = randomBytes(24).toString('hex');
    const payload = `${this.state.generation}.${nonce}`;
    return `${payload}.${createHmac('sha256', this.state.key).update(payload).digest('hex')}`;
  }

  authorized(session: string): boolean {
    if (this.status() === 'open') {
      return true;
    }
    if (this.status() !== 'pin_required') {
      return false;
    }
    const parts = session.split('.');
    if (
      parts.length !== 3 ||
      parts[0] !== String(this.state.generation) ||
      !/^[a-f0-9]{48}$/.test(parts[1]) ||
      !/^[a-f0-9]{64}$/.test(parts[2])
    ) {
      return false;
    }
    const signature = createHmac('sha256', this.state.key)
      .update(`${parts[0]}.${parts[1]}`)
      .digest();
    return timingSafeEqual(signature, Buffer.from(parts[2], 'hex'));
  }
}
