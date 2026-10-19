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

export interface ServerDependencies {
  config: ConfigRepository;
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
    logger: dependencies.logger
      ? {
          redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
        }
      : false,
    trustProxy: false,
    ...(dependencies.httpsOptions ? { https: dependencies.httpsOptions } : {}),
  });

  app.addHook('onRequest', async (request, reply) => {
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

  registerApiRoutes(app, dependencies, listenerMode);
  if (dependencies.staticDirectory) {
    registerStaticFiles(app, dependencies.staticDirectory);
  }
  return app;
}
