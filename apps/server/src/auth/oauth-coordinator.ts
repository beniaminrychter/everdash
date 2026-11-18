import { OAuthFlowError } from './oauth-flow-error';

export { OAuthFlowError } from './oauth-flow-error';
import {
  adminCookie,
  clearAdminCookie,
  clearTransactionCookie,
  transactionCookie,
} from './admin-cookies';
import { AdminSessions } from './admin-sessions';
import type { AdminIdentity } from './admin-sessions';
import { OAuthTransactions } from './admin-state';
import { verifyAdmin } from './admin-identity';
import type { ConnectorRepository, ConnectorStatus } from './connector-repository';
import type { HouseholdCredentialProvider } from './credential-provider';
import type { DiscoveredHomeAssistant } from '@everdash/contracts/auth/oauth';
import { discoverHomeAssistantInstances } from './discover';
import { authorizeUrl, exchangeCode, probeHomeAssistant, revokeGrant } from './oauth-protocol';
import type { OAuthGrant } from './oauth-protocol';
import { parseHomeAssistantOrigin } from './origin';

export interface OAuthCoordinatorOptions {
  repository: ConnectorRepository;
  provider: HouseholdCredentialProvider;
  sessions?: AdminSessions;
  transactions?: OAuthTransactions;
  exchange?: typeof exchangeCode;
  verify?: typeof verifyAdmin;
  revoke?: typeof revokeGrant;
  probe?: typeof probeHomeAssistant;
  discover?: (extraOrigins?: readonly string[]) => Promise<DiscoveredHomeAssistant[]>;
}

export class OAuthCoordinator {
  private readonly sessions: AdminSessions;
  private readonly transactions: OAuthTransactions;
  private queue: Promise<void> = Promise.resolve();
  private discoverInFlight: Promise<DiscoveredHomeAssistant[]> | null = null;
  constructor(private readonly options: OAuthCoordinatorOptions) {
    this.sessions = options.sessions ?? new AdminSessions();
    this.transactions = options.transactions ?? new OAuthTransactions();
  }

  /**
   * Fails early when the server cannot reach the Home Assistant address the
   * browser will be sent to, e.g. `localhost` from inside a container.
   */
  async checkReachable(homeAssistantOrigin?: string): Promise<void> {
    const status = this.options.repository.status();
    let origin: string;
    try {
      origin =
        status.state === 'connected'
          ? status.origin
          : parseHomeAssistantOrigin(homeAssistantOrigin ?? '');
    } catch {
      // Malformed input is rejected by begin() with INVALID_REQUEST.
      return;
    }

    try {
      await (this.options.probe ?? probeHomeAssistant)(origin);
    } catch {
      throw new OAuthFlowError('HA_UNREACHABLE');
    }
  }

  begin(input: {
    browserOrigin: string;
    homeAssistantOrigin?: string;
    intent: 'login' | 'reconnect';
    secure: boolean;
  }): { authorizationUrl: string; transactionCookie: string } {
    try {
      const clientId = parseHomeAssistantOrigin(input.browserOrigin);
      if (
        clientId !== input.browserOrigin ||
        (input.intent !== 'login' && input.intent !== 'reconnect')
      ) {
        throw new OAuthFlowError('INVALID_REQUEST');
      }
      const status = this.options.repository.status();
      if (status.state === 'repair-required') {
        throw new OAuthFlowError('CONNECTOR_REPAIR');
      }
      const requested =
        input.homeAssistantOrigin === undefined
          ? undefined
          : parseHomeAssistantOrigin(input.homeAssistantOrigin);
      if (
        (status.state === 'connected' && requested && requested !== status.origin) ||
        (status.state === 'unconfigured' && (!requested || input.intent === 'reconnect'))
      ) {
        throw new OAuthFlowError('INVALID_REQUEST');
      }
      const origin = status.state === 'connected' ? status.origin : requested!;
      const redirectUri = `${clientId}/api/manage/auth/callback`;
      const tx = this.transactions.create({ origin, clientId, redirectUri, intent: input.intent });
      return {
        authorizationUrl: authorizeUrl(origin, clientId, redirectUri, tx.state),
        transactionCookie: transactionCookie(tx.binding, input.secure),
      };
    } catch (error) {
      if (error instanceof OAuthFlowError) {
        throw error;
      }
      throw new OAuthFlowError('INVALID_REQUEST');
    }
  }

  async complete(input: {
    state?: string | null;
    binding?: string | null;
    code?: string | null;
    error?: string | null;
    callbackOrigin: string;
    secure: boolean;
  }): Promise<{
    session: string;
    adminCookie: string;
    clearTransactionCookie: string;
    durability: 'confirmed' | 'uncertain';
  }> {
    const tx =
      input.state && input.binding ? this.transactions.consume(input.state, input.binding) : null;
    if (
      !tx ||
      input.callbackOrigin !== tx.clientId ||
      typeof input.code !== 'string' ||
      !input.code ||
      input.error
    ) {
      throw new OAuthFlowError('INVALID_REQUEST');
    }
    let grant: OAuthGrant | undefined;
    let retained = false;
    try {
      grant = await (this.options.exchange ?? exchangeCode)(tx.origin, tx.clientId, input.code);
      const identity = await (this.options.verify ?? verifyAdmin)(tx.origin, grant.accessToken);
      const verifiedGrant = grant;
      const finalize = async () => {
        const status = this.options.repository.status();
        if (status.state === 'repair-required') {
          throw new OAuthFlowError('CONNECTOR_REPAIR');
        }
        if (status.state === 'connected' && status.origin !== tx.origin) {
          throw new OAuthFlowError('INVALID_REQUEST');
        }
        let generation: string;
        let durability: 'confirmed' | 'uncertain' =
          status.state === 'connected' && status.durability === 'uncertain'
            ? 'uncertain'
            : 'confirmed';
        if (status.state === 'unconfigured' || tx.intent === 'reconnect') {
          const installed = await this.options.repository.install(
            { origin: tx.origin, clientId: tx.clientId, refreshToken: verifiedGrant.refreshToken },
            { replace: status.state === 'connected' },
          );
          retained = true;
          generation = installed.generation;
          durability = installed.durability;
          this.options.provider.installGrant(generation, verifiedGrant);
        } else {
          generation = status.generation;
          await this.cleanup(tx.origin, verifiedGrant.refreshToken);
          retained = true;
        }
        const session = this.sessions.issue({ userId: identity.id, origin: tx.origin, generation });
        return {
          session,
          adminCookie: adminCookie(session, input.secure),
          clearTransactionCookie: clearTransactionCookie(input.secure),
          durability,
        };
      };
      const operation = this.queue.then(finalize);
      this.queue = operation.then(
        () => undefined,
        () => undefined,
      );
      return await operation;
    } catch (error) {
      if (grant && !retained) {
        await this.cleanup(tx.origin, grant.refreshToken);
      }
      if (error instanceof OAuthFlowError) {
        throw error;
      }
      if (!grant) {
        await this.checkReachable(tx.origin);
      }
      throw new OAuthFlowError('AUTH_FAILED');
    }
  }

  private async cleanup(origin: string, refreshToken: string): Promise<void> {
    const current = this.options.repository.readCredentials();
    if (current?.origin === origin && current.refreshToken === refreshToken) {
      return;
    }
    try {
      await (this.options.revoke ?? revokeGrant)(origin, refreshToken);
    } catch {
      // Revocation is best effort and must not expose provider errors.
    }
  }

  status(): ConnectorStatus {
    return this.options.provider.status();
  }

  readSession(session: string): AdminIdentity | null {
    const status = this.options.repository.status();
    if (status.state !== 'connected') {
      return null;
    }
    return this.sessions.read(session, status.origin, status.generation);
  }

  /** Forgets the connection so an administrator can connect another instance. */
  async disconnect(session: string, secure: boolean): Promise<{ clearAdminCookie: string }> {
    if (!this.readSession(session)) {
      throw new OAuthFlowError('INVALID_REQUEST');
    }

    const operation = this.queue.then(() => this.options.repository.remove());
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    );
    const removed = await operation;
    this.sessions.logout(session);

    if (removed) {
      try {
        await (this.options.revoke ?? revokeGrant)(removed.origin, removed.refreshToken);
      } catch {
        // Revocation is best effort; the credential is already forgotten locally.
      }
    }

    return { clearAdminCookie: clearAdminCookie(secure) };
  }

  logout(session: string, secure: boolean): { clearAdminCookie: string } {
    this.sessions.logout(session);
    return { clearAdminCookie: clearAdminCookie(secure) };
  }

  /** Scans the local network for reachable Home Assistant instances, coalescing concurrent scans. */
  async discover(): Promise<DiscoveredHomeAssistant[]> {
    if (this.discoverInFlight) {
      return this.discoverInFlight;
    }

    const status = this.options.repository.status();
    const extraOrigins = status.state === 'connected' ? [status.origin] : undefined;
    const run = this.options.discover
      ? this.options.discover(extraOrigins)
      : discoverHomeAssistantInstances({ extraOrigins });

    this.discoverInFlight = run;

    try {
      return await run;
    } finally {
      this.discoverInFlight = null;
    }
  }
}
