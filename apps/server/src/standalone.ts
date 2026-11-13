import { resolve } from 'node:path';
import { isIP } from 'node:net';
import { buildApp } from './app';
import { ConfigRepository } from './config/repository';
import { ConnectorRepository } from './auth/connector-repository';
import { HouseholdCredentialProvider } from './auth/credential-provider';
import { OAuthCoordinator } from './auth/oauth-coordinator';
import { actualOrigin } from './auth/oauth-http';
import { createHomeAssistantClient } from './home-assistant/client';
import { TabletAccess } from './auth/tablet-access';

export interface StandaloneOptions {
  dataDirectory?: string;
  staticDirectory?: string;
  adminStaticDirectory?: string;
  previewDirectory?: string;
  logger?: boolean;
  trustedProxyCidrs?: string[];
}

export async function createStandaloneApp(options: StandaloneOptions = {}) {
  const trustedProxyCidrs =
    options.trustedProxyCidrs ??
    process.env.EVERDASH_TRUSTED_PROXIES?.split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  for (const cidr of trustedProxyCidrs ?? []) {
    const match = /^([^/]+)\/(\d+)$/.exec(cidr);
    const version = match ? isIP(match[1]) : 0;
    const bits = match ? Number(match[2]) : 0;
    if (!version || bits < 1 || bits > (version === 4 ? 32 : 128)) {
      throw new Error('Trusted proxy entries must be explicit CIDR ranges.');
    }
  }
  const directory = options.dataDirectory ?? process.env.EVERDASH_DATA_DIR ?? '/data';
  const config = new ConfigRepository({ directory });
  const connector = new ConnectorRepository({ directory });
  const provider = new HouseholdCredentialProvider({ repository: connector });
  const oauth = new OAuthCoordinator({ repository: connector, provider });
  const tabletAccess = await TabletAccess.open(directory);
  const app = await buildApp(
    {
      config,
      oauth,
      tabletAccess,
      homeAssistant: createHomeAssistantClient({ provider }),
      staticDirectory: options.staticDirectory ?? resolve('dist'),
      adminStaticDirectory: options.adminStaticDirectory ?? resolve('dist-admin'),

      logger: options.logger ?? true,
      trustedProxyCidrs,
      expectedOrigin: (request) => {
        try {
          return actualOrigin(request);
        } catch {
          return null;
        }
      },
    },
    'management',
  );
  return { app, config, connector, provider, oauth, tabletAccess };
}
