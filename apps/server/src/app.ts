import Fastify from 'fastify';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ConfigRepository } from './config/repository';
import type { HomeAssistantTransport } from './home-assistant/client';
import type { AccessPolicy } from './http/access-policy';
import { apiError, mapRouteError } from './http/errors';
import { registerApiRoutes } from './http/routes';
import { registerStaticFiles } from './http/static';
import type { OAuthCoordinator } from './auth/oauth-coordinator';
import { registerOAuthRoutes } from './auth/oauth-http';
import type { TabletAccess } from './auth/tablet-access';

export interface IngressAppOptions {
  allowedProxyIps: readonly string[];
  tabletPort?: number;
}

export interface ServerDependencies {
  config: ConfigRepository;
  homeAssistant: HomeAssistantTransport;
  access: AccessPolicy;
  oauth?: OAuthCoordinator;
  tabletAccess?: TabletAccess;
  expectedOrigin?: (request: FastifyRequest) => string | null;
  staticDirectory?: string;
  adminStaticDirectory?: string;
  trustedProxyCidrs?: string[];
  supervisorConnected?: boolean;
  tabletPort?: number;
  ingress?: IngressAppOptions;
  logger?: boolean;
}

export function normalizeRemoteIp(address: string | undefined): string {
  if (!address) {
    return '';
  }

  const trimmed = address.trim();
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice(7);
  }

  return trimmed;
}

export function isAllowedIngressProxy(
  address: string | undefined,
  allowedProxyIps: readonly string[],
): boolean {
  const ip = normalizeRemoteIp(address);
  return Boolean(ip && allowedProxyIps.includes(ip));
}

export async function buildApp(dependencies: ServerDependencies): Promise<FastifyInstance> {
  const ingress = dependencies.ingress;
  const app = Fastify({
    bodyLimit: 256 * 1024,
    disableRequestLogging: true,
    logger: dependencies.logger
      ? {
          redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
        }
      : false,
    trustProxy: ingress
      ? (address: string) => isAllowedIngressProxy(address, ingress.allowedProxyIps)
      : (dependencies.trustedProxyCidrs ?? false),
  });

  if (ingress) {
    app.addHook('onRequest', async (request, reply) => {
      if (!isAllowedIngressProxy(request.socket.remoteAddress, ingress.allowedProxyIps)) {
        return reply
          .code(403)
          .send(
            apiError('INGRESS_PROXY_REQUIRED', 'Direct access to the Ingress port is forbidden.'),
          );
      }
    });
  }

  app.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/api/')) {
      reply.header('Cache-Control', 'no-store');
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('Referrer-Policy', 'no-referrer');
    }
  });

  app.get('/health', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return { status: 'ok' };
  });

  // Fastify registers its error handler through this required callback API.
  // oxlint-disable-next-line promise/prefer-await-to-callbacks
  app.setErrorHandler(async (error, _request, reply) => {
    const mapped = mapRouteError(error);
    if (mapped.retryAfterSeconds !== undefined) {
      reply.header('Retry-After', mapped.retryAfterSeconds);
    }
    await reply.code(mapped.status).send(mapped.body);
  });

  if (dependencies.oauth) {
    registerOAuthRoutes(app, dependencies.oauth, {
      isIngress: Boolean(ingress),
      supervisorConnected: dependencies.supervisorConnected,
      tabletPort: ingress?.tabletPort ?? dependencies.tabletPort,
      isAdmin: dependencies.access.isAdmin,
      homeAssistant: dependencies.homeAssistant,
    });
  }
  registerApiRoutes(app, dependencies);
  if (ingress) {
    if (dependencies.adminStaticDirectory) {
      registerStaticFiles(app, dependencies.adminStaticDirectory);
    }
  } else if (dependencies.staticDirectory) {
    registerStaticFiles(app, dependencies.staticDirectory, dependencies.adminStaticDirectory);
  }
  return app;
}
