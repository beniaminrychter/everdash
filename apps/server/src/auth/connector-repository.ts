import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensurePrivateDirectory, writeAtomicJson } from '../persistence/atomic-json';
import { parseHomeAssistantOrigin } from './origin';

export interface ConnectorCredentials {
  origin: string;
  refreshToken: string;
  clientId: string;
  generation: string;
}
export type ConnectorStatus =
  | { state: 'unconfigured' }
  | { state: 'repair-required' }
  | { state: 'connected'; origin: string; generation: string };
export interface ConnectorRepositoryOptions {
  directory: string;
  beforeRename?: () => void;
}
export interface ConnectorInstall {
  origin: string;
  refreshToken: string;
  clientId: string;
}

export class ConnectorRepository {
  private readonly path: string;
  private queue: Promise<void> = Promise.resolve();
  constructor(private readonly options: ConnectorRepositoryOptions) {
    this.path = join(options.directory, 'connector.json');
  }

  private load():
    | { state: 'unconfigured' | 'repair-required' }
    | { state: 'connected'; credentials: ConnectorCredentials } {
    let raw: string;
    try {
      raw = readFileSync(this.path, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { state: 'unconfigured' };
      }
      return { state: 'repair-required' };
    }
    try {
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object') {
        return { state: 'repair-required' };
      }
      const item = value as Record<string, unknown>;
      if (
        typeof item.origin !== 'string' ||
        parseHomeAssistantOrigin(item.origin) !== item.origin ||
        typeof item.refreshToken !== 'string' ||
        !item.refreshToken ||
        typeof item.clientId !== 'string' ||
        !item.clientId ||
        typeof item.generation !== 'string' ||
        !item.generation
      ) {
        return { state: 'repair-required' };
      }
      return {
        state: 'connected',
        credentials: {
          origin: item.origin,
          refreshToken: item.refreshToken,
          clientId: item.clientId,
          generation: item.generation,
        },
      };
    } catch {
      return { state: 'repair-required' };
    }
  }

  status(): ConnectorStatus {
    const result = this.load();
    if (result.state === 'connected') {
      return {
        state: 'connected',
        origin: result.credentials.origin,
        generation: result.credentials.generation,
      };
    }
    return { state: result.state };
  }

  readCredentials(): ConnectorCredentials | null {
    const result = this.load();
    return result.state === 'connected' ? result.credentials : null;
  }

  install(
    input: ConnectorInstall,
    options: { replace?: boolean } = {},
  ): Promise<ConnectorCredentials> {
    const operation = this.queue.then(() => {
      const origin = parseHomeAssistantOrigin(input.origin);
      if (!input.refreshToken || !input.clientId) {
        throw new Error('Invalid connector credentials.');
      }
      const current = this.load();
      if (current.state === 'repair-required') {
        throw new Error('Connector repair required.');
      }
      if (
        current.state === 'connected' &&
        (!options.replace || current.credentials.origin !== origin)
      ) {
        throw new Error('Connector replacement is not permitted.');
      }
      const next = {
        origin,
        refreshToken: input.refreshToken,
        clientId: input.clientId,
        generation: randomUUID(),
      };
      ensurePrivateDirectory(this.options.directory);
      writeAtomicJson(this.path, next, this.options.beforeRename);
      return next;
    });
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }
}
