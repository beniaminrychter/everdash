import Fastify from 'fastify';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ConfigRepository } from './config/repository';
import type { HomeAssistantTransport } from './home-assistant/client';
import type { AccessPolicy } from './http/access-policy';
import { mapRouteError } from './http/errors';
import { registerApiRoutes } from './http/routes';
import { registerStaticFiles } from './http/static';
import type { OAuthCoordinator } from './auth/oauth-coordinator';
import { registerOAuthRoutes } from './auth/oauth-http';
import type { TabletAccess } from './auth/tablet-access';

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
  logger?: boolean;
}

export async function buildApp(dependencies: ServerDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    bodyLimit: 256 * 1024,
    disableRequestLogging: true,
    logger: dependencies.logger
      ? {
          redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
        }
      : false,
    trustProxy: dependencies.trustedProxyCidrs ?? false,
  });

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
    registerOAuthRoutes(app, dependencies.oauth);
  }
  registerApiRoutes(app, dependencies);
  if (dependencies.staticDirectory) {
    registerStaticFiles(app, dependencies.staticDirectory, dependencies.adminStaticDirectory);
  }
  return app;
}
