import type { ConnectorRepository, ConnectorStatus } from './connector-repository';
import { refreshGrant } from './oauth-protocol';
import type { OAuthGrant } from './oauth-protocol';
import { HomeAssistantUpstreamError } from '../home-assistant/errors';

export interface HouseholdAccessToken {
  origin: string;
  generation: string;
  accessToken: string;
}

type CachedToken = HouseholdAccessToken & { expiresAt: number };
export interface HouseholdCredentialProviderOptions {
  repository: ConnectorRepository;
  refresh?: typeof refreshGrant;
  now?: () => number;
}

export class HouseholdCredentialProvider {
  private cached: CachedToken | null = null;
  private pending: { generation: string; promise: Promise<HouseholdAccessToken> } | null = null;
  private readonly now: () => number;
  private readonly refresh: typeof refreshGrant;

  constructor(private readonly options: HouseholdCredentialProviderOptions) {
    this.now = options.now ?? Date.now;
    this.refresh = options.refresh ?? refreshGrant;
  }

  status(): ConnectorStatus {
    return this.options.repository.status();
  }

  isCurrent(token: HouseholdAccessToken): boolean {
    const credentials = this.options.repository.readCredentials();
    return credentials?.generation === token.generation && credentials.origin === token.origin;
  }

  invalidate(token: HouseholdAccessToken): void {
    if (this.cached === token) {
      this.cached = null;
    }
  }

  installGrant(generation: string, grant: OAuthGrant): void {
    const credentials = this.options.repository.readCredentials();
    if (
      !credentials ||
      credentials.generation !== generation ||
      credentials.refreshToken !== grant.refreshToken
    ) {
      throw new HomeAssistantUpstreamError(
        'Home Assistant connection changed.',
        401,
        'HA_CREDENTIAL_REPAIR',
      );
    }
    this.cached = this.makeToken(credentials.origin, generation, grant);
  }

  private makeToken(origin: string, generation: string, grant: OAuthGrant): CachedToken {
    const lifetime = grant.expiresIn * 1000;
    return {
      origin,
      generation,
      accessToken: grant.accessToken,
      expiresAt: this.now() + lifetime - Math.min(5000, lifetime / 10),
    };
  }

  async get(): Promise<HouseholdAccessToken> {
    const credentials = this.options.repository.readCredentials();
    if (!credentials) {
      throw new HomeAssistantUpstreamError(
        'Home Assistant connection needs repair.',
        401,
        'HA_CREDENTIAL_REPAIR',
      );
    }
    if (this.cached?.generation === credentials.generation && this.cached.expiresAt > this.now()) {
      return this.cached;
    }
    if (this.pending?.generation === credentials.generation) {
      return this.pending.promise;
    }
    const promise = (async () => {
      let grant: OAuthGrant;
      try {
        grant = await this.refresh(
          credentials.origin,
          credentials.clientId,
          credentials.refreshToken,
        );
      } catch {
        throw new HomeAssistantUpstreamError(
          'Cannot refresh Home Assistant credential.',
          502,
          'HA_UNAVAILABLE',
        );
      }
      if (!this.isCurrent({ ...credentials, accessToken: grant.accessToken })) {
        throw new HomeAssistantUpstreamError(
          'Home Assistant connection changed.',
          401,
          'HA_CREDENTIAL_REPAIR',
        );
      }
      if (grant.refreshToken !== credentials.refreshToken) {
        throw new HomeAssistantUpstreamError(
          'Home Assistant connection needs repair.',
          401,
          'HA_CREDENTIAL_REPAIR',
        );
      }
      const token = this.makeToken(credentials.origin, credentials.generation, grant);
      this.cached = token;
      return token;
    })();
    this.pending = { generation: credentials.generation, promise };
    try {
      return await promise;
    } finally {
      if (this.pending?.promise === promise) {
        this.pending = null;
      }
    }
  }
}
