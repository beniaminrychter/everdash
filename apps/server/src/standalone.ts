import { resolve } from 'node:path';
import { isIP } from 'node:net';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { buildApp, isAllowedIngressProxy } from './app';
import { ConfigRepository } from './config/repository';
import { ConnectorRepository } from './auth/connector-repository';
import { HouseholdCredentialProvider } from './auth/credential-provider';
import { OAuthCoordinator } from './auth/oauth-coordinator';
import { actualOrigin } from './auth/oauth-http';
import { ADMIN_COOKIE, TABLET_COOKIE, readCookie } from './auth/admin-cookies';
import { createHomeAssistantClient, createSupervisorHomeAssistant } from './home-assistant/client';
import type { HomeAssistantTransport } from './home-assistant/client';
import { TabletAccess } from './auth/tablet-access';

export interface StandaloneIngressOptions {
  allowedProxyIps?: readonly string[];
  tabletPort?: number;
}

export interface StandaloneOptions {
  dataDirectory?: string;
  staticDirectory?: string;
  adminStaticDirectory?: string;
  logger?: boolean;
  trustedProxyCidrs?: string[];
  supervisorToken?: string;
  supervisorApiRoot?: string;
  supervisorRequest?: typeof fetch;
  ingress?: StandaloneIngressOptions;
}

function expectedOrigin(request: FastifyRequest): string | null {
  try {
    return actualOrigin(request);
  } catch {
    return null;
  }
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

  const supervisorToken = (options.supervisorToken ?? process.env.SUPERVISOR_TOKEN)?.trim() || '';
  const oauthClient = createHomeAssistantClient({ provider });
  const supervisorClient = supervisorToken
    ? createSupervisorHomeAssistant({
        token: supervisorToken,
        apiRoot: options.supervisorApiRoot,
        request: options.supervisorRequest,
      })
    : null;
  const activeClient = (): HomeAssistantTransport => {
    if (provider.status().state === 'unconfigured' && supervisorClient) {
      return supervisorClient;
    }

    return oauthClient;
  };
  const homeAssistant: HomeAssistantTransport = {
    getStates: (signal) => activeClient().getStates(signal),
    getState: (entityId, signal) => activeClient().getState(entityId, signal),
    callService: (domain, service, data, signal) =>
      activeClient().callService(domain, service, data, signal),
  };

  const staticDirectory = options.staticDirectory ?? resolve('dist');
  const adminStaticDirectory = options.adminStaticDirectory ?? resolve('dist-admin');

  const app = await buildApp({
    config,
    oauth,
    tabletAccess,
    access: {
      isAdmin: (request) => {
        const session = readCookie(request.headers.cookie, ADMIN_COOKIE);
        return !!session && !!oauth.readSession(session);
      },
      isTablet: (request) =>
        tabletAccess.authorized(readCookie(request.headers.cookie, TABLET_COOKIE) ?? ''),
    },
    homeAssistant,
    staticDirectory,
    adminStaticDirectory,
    logger: options.logger ?? true,
    trustedProxyCidrs,
    supervisorConnected: Boolean(supervisorClient),
    expectedOrigin,
  });

  let ingressApp: FastifyInstance | null = null;
  if (options.ingress) {
    const allowedProxyIps = options.ingress.allowedProxyIps?.length
      ? [...options.ingress.allowedProxyIps]
      : ['172.30.32.2'];
    ingressApp = await buildApp({
      config,
      oauth,
      tabletAccess,
      access: {
        isAdmin: (request) => isAllowedIngressProxy(request.socket.remoteAddress, allowedProxyIps),
        isTablet: () => false,
      },
      homeAssistant,
      adminStaticDirectory,
      logger: options.logger ?? true,
      supervisorConnected: Boolean(supervisorClient),
      ingress: {
        allowedProxyIps,
        tabletPort: options.ingress.tabletPort,
      },
      expectedOrigin,
    });
  }

  return { app, ingressApp, config, connector, provider, oauth, tabletAccess };
}
