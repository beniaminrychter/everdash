import { randomBytes } from 'node:crypto';
import { parseHomeAssistantOrigin } from './origin';

export interface OAuthTransaction {
  origin: string;
  clientId: string;
  redirectUri: string;
  intent: 'login' | 'reconnect';
}

import { BoundedStore } from './bounded-store';
import type { StoreOptions } from './bounded-store';

const TRANSACTION_LIFETIME = 600_000;

function token(): string {
  return randomBytes(32).toString('base64url');
}

export class OAuthTransactions {
  private readonly store: BoundedStore<{ binding: string; transaction: OAuthTransaction }>;

  constructor(options: StoreOptions = {}) {
    this.store = new BoundedStore(options);
  }

  create(transaction: OAuthTransaction): { state: string; binding: string } {
    const state = token();
    const binding = token();
    const origin = parseHomeAssistantOrigin(transaction.origin);
    this.store.add(
      state,
      { binding, transaction: { ...transaction, origin } },
      TRANSACTION_LIFETIME,
    );
    return { state, binding };
  }

  consume(state: string, binding: string): OAuthTransaction | null {
    const entry = this.store.get(state);
    if (!entry || entry.binding !== binding) {
      return null;
    }
    this.store.delete(state);
    return { ...entry.transaction };
  }
}
