import Fastify from 'fastify';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ServerOptions } from 'node:https';
import type { ConfigRepository } from './config/repository';
import type { HomeAssistantTransport } from './home-assistant/client';
import type { DeviceRepository } from './auth/devices';
import type { DeviceSessions } from './auth/sessions';
import type { PairingService } from './auth/pairing';
import { isTrustedIngressPeer } from './auth/ingress';
import { mapRouteError } from './http/errors';
import { registerApiRoutes } from './http/routes';
import { registerStaticFiles } from './http/static';
import type { OAuthCoordinator } from './auth/oauth-coordinator';
import { registerOAuthRoutes } from './auth/oauth-http';
import type { SupervisorAccessInfo } from './supervisor/access';
import type { TabletAccess } from './auth/tablet-access';

export interface ServerDependencies {
  config: ConfigRepository;
  oauth?: OAuthCoordinator;
  tabletAccess?: TabletAccess;
  adminStaticDirectory?: string;
  trustedProxyCidrs?: string[];
  devices?: DeviceRepository;
  deviceSessions?: DeviceSessions;
  pairing?: PairingService;
  authorize?: (
    request: FastifyRequest,
    mode: 'management' | 'direct',
  ) => boolean | Promise<boolean>;
  expectedOrigin?: (request: FastifyRequest, mode: 'management' | 'direct') => string | null;
  homeAssistant: HomeAssistantTransport;
  staticDirectory?: string;
  previewDirectory?: string;
  getAccessInfo?: () => Promise<SupervisorAccessInfo>;
  secureCookies?: boolean;
  deviceCookieName?: string;
  logger?: boolean;
  requireIngressPeer?: boolean;
  httpsOptions?: ServerOptions;
}

export async function buildApp(
  dependencies: ServerDependencies,
  listenerMode: 'management' | 'direct',
): Promise<FastifyInstance> {
  const app = Fastify({
    bodyLimit: 256 * 1024,
    disableRequestLogging: true,
    logger: dependencies.logger
      ? {
          redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
        }
      : false,
    trustProxy: dependencies.trustedProxyCidrs ?? false,
    ...(dependencies.httpsOptions ? { https: dependencies.httpsOptions } : {}),
  });

  app.addHook('onRequest', async (request, reply) => {
    if (
      dependencies.oauth &&
      /^\/api\/(?:pairings(?:\/|$)|logout$|manage\/(?:devices(?:\/|$)|pairings(?:\/|$)))/.test(
        request.url,
      )
    ) {
      return reply.code(404).send({ code: 'NOT_FOUND' });
    }
    if (
      listenerMode === 'management' &&
      dependencies.requireIngressPeer &&
      request.url !== '/health' &&
      !isTrustedIngressPeer(request.raw.socket.remoteAddress)
    ) {
      reply
        .code(403)
        .send({ code: 'INGRESS_PEER_REQUIRED', message: 'Use Home Assistant Ingress.' });
      return;
    }
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
    registerOAuthRoutes(app, dependencies.oauth);
  }
  registerApiRoutes(app, dependencies, listenerMode);
  if (dependencies.staticDirectory) {
    registerStaticFiles(
      app,
      dependencies.staticDirectory,
      dependencies.previewDirectory,
      dependencies.adminStaticDirectory,
    );
  }
  return app;
}
