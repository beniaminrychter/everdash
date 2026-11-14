import { randomBytes } from 'node:crypto';
import { BoundedStore } from './bounded-store';
import type { StoreOptions } from './bounded-store';

export interface AdminIdentity {
  userId: string;
  origin: string;
  generation: string;
}

const SESSION_LIFETIME = 28_800_000;

function token(): string {
  return randomBytes(32).toString('base64url');
}

export class AdminSessions {
  private readonly store: BoundedStore<AdminIdentity>;

  constructor(options: StoreOptions = {}) {
    this.store = new BoundedStore(options);
  }

  issue(identity: AdminIdentity): string {
    const session = token();
    this.store.add(session, { ...identity }, SESSION_LIFETIME);
    return session;
  }

  read(session: string, origin: string, generation: string): AdminIdentity | null {
    const identity = this.store.get(session);
    if (!identity || identity.origin !== origin || identity.generation !== generation) {
      return null;
    }
    return { ...identity };
  }

  logout(session: string): void {
    this.store.delete(session);
  }
}
