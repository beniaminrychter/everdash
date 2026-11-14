import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type {
  AuthErrorCode,
  AuthSessionResponse,
  AuthStartRequest,
} from '@everdash/contracts/auth/oauth';
import {
  ADMIN_COOKIE,
  TRANSACTION_COOKIE,
  clearTransactionCookie,
  readCookie,
} from './admin-cookies';
import type { OAuthCoordinator } from './oauth-coordinator';
import { OAuthFlowError } from './oauth-flow-error';
import { parseHomeAssistantOrigin } from './origin';

const prefix = '/api/manage/auth';

/**
 * Home Assistant's login page appends `storeToken=true` when "Keep me logged
 * in" is checked; it only affects HA's own frontend and is ignored here.
 */
const CALLBACK_KEYS = new Set(['state', 'code', 'error', 'storeToken']);

/** Fastify applies forwarded values only when the connecting peer is trusted. */
export function actualOrigin(request: FastifyRequest): string {
  const protocol = request.protocol;
  const host = request.host;
  if ((protocol !== 'http' && protocol !== 'https') || !host || /[,\s/@\\?#]/.test(host)) {
    throw new Error('Invalid request authority');
  }
  return parseHomeAssistantOrigin(`${protocol}://${host}`);
}

export function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
  coordinator: OAuthCoordinator,
): boolean {
  const value = readCookie(request.headers.cookie, ADMIN_COOKIE);
  if (!value || !coordinator.readSession(value)) {
    reply.code(401).send({ error: 'UNAUTHORIZED' });
    return false;
  }
  return true;
}

function secureHeaders(reply: FastifyReply): void {
  reply.header('Cache-Control', 'no-store');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Referrer-Policy', 'no-referrer');
}

function mutationOrigin(request: FastifyRequest): string | null {
  try {
    const origin = actualOrigin(request);
    if (request.headers.origin !== origin || request.headers['x-everdash-request'] !== '1') {
      return null;
    }
    return origin;
  } catch {
    return null;
  }
}

function validStart(body: unknown): body is AuthStartRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return false;
  }
  const item = body as Record<string, unknown>;
  return (
    Object.keys(item).every((key) => key === 'intent' || key === 'homeAssistantOrigin') &&
    (item.intent === 'login' || item.intent === 'reconnect') &&
    (item.homeAssistantOrigin === undefined || typeof item.homeAssistantOrigin === 'string')
  );
}

function errorCode(error: unknown): AuthErrorCode {
  return error instanceof OAuthFlowError ? error.code : 'AUTH_FAILED';
}

export function registerOAuthRoutes(app: FastifyInstance, coordinator: OAuthCoordinator): void {
  app.addHook('onRequest', async (request, reply) => {
    if (request.routeOptions.url?.startsWith(`${prefix}/`)) {
      secureHeaders(reply);
    }
  });

  app.post(`${prefix}/start`, async (request, reply) => {
    const origin = mutationOrigin(request);
    if (!origin) {
      return reply.code(403).send({ error: 'FORBIDDEN' });
    }
    if (!validStart(request.body)) {
      return reply.code(400).send({ error: 'INVALID_REQUEST' });
    }
    if (request.body.intent === 'reconnect' && !requireAdmin(request, reply, coordinator)) {
      return reply;
    }
    try {
      await coordinator.checkReachable(request.body.homeAssistantOrigin);
      const result = coordinator.begin({
        browserOrigin: origin,
        intent: request.body.intent,
        homeAssistantOrigin: request.body.homeAssistantOrigin,
        secure: origin.startsWith('https:'),
      });
      return reply
        .header('Set-Cookie', result.transactionCookie)
        .send({ authorizationUrl: result.authorizationUrl });
    } catch (error) {
      const code = errorCode(error);
      return reply.code(code === 'HA_UNREACHABLE' ? 502 : 400).send({ error: code });
    }
  });

  app.get(`${prefix}/callback`, async (request, reply) => {
    let secure = false;
    try {
      const origin = actualOrigin(request);
      secure = origin.startsWith('https:');
      const query = request.query as Record<string, unknown>;
      if (
        !query ||
        Object.keys(query).some((key) => !CALLBACK_KEYS.has(key)) ||
        typeof query.state !== 'string' ||
        (query.code !== undefined && typeof query.code !== 'string') ||
        (query.error !== undefined && typeof query.error !== 'string')
      ) {
        throw new OAuthFlowError('INVALID_REQUEST');
      }
      const result = await coordinator.complete({
        state: query.state,
        code: query.code as string | undefined,
        error: query.error as string | undefined,
        binding: readCookie(request.headers.cookie, TRANSACTION_COOKIE),
        callbackOrigin: origin,
        secure,
      });
      return reply
        .header('Set-Cookie', [result.clearTransactionCookie, result.adminCookie])
        .redirect('/admin/');
    } catch (error) {
      return reply
        .header('Set-Cookie', clearTransactionCookie(secure))
        .redirect(`/admin/?auth_error=${errorCode(error)}`);
    }
  });

  app.get(`${prefix}/session`, async (request, reply) => {
    const cookie = readCookie(request.headers.cookie, ADMIN_COOKIE);
    const status = coordinator.status();
    const authenticated = !!cookie && !!coordinator.readSession(cookie);
    const result: AuthSessionResponse = { authenticated, connection: status.state };
    // Not secret: /start already redirects any visitor to this address.
    if (status.state === 'connected') {
      result.homeAssistantOrigin = status.origin;
    }
    if (status.state === 'connected' && status.durability === 'uncertain') {
      result.durability = 'uncertain';
    }
    return reply.send(result);
  });

  app.post(`${prefix}/disconnect`, async (request, reply) => {
    const origin = mutationOrigin(request);
    if (!origin) {
      return reply.code(403).send({ error: 'FORBIDDEN' });
    }
    if (!requireAdmin(request, reply, coordinator)) {
      return reply;
    }
    const cookie = readCookie(request.headers.cookie, ADMIN_COOKIE) ?? '';
    const result = await coordinator.disconnect(cookie, origin.startsWith('https:'));
    return reply.header('Set-Cookie', result.clearAdminCookie).send({ ok: true });
  });

  app.post(`${prefix}/logout`, async (request, reply) => {
    const origin = mutationOrigin(request);
    if (!origin) {
      return reply.code(403).send({ error: 'FORBIDDEN' });
    }
    const cookie = readCookie(request.headers.cookie, ADMIN_COOKIE) ?? '';
    const result = coordinator.logout(cookie, origin.startsWith('https:'));
    return reply.header('Set-Cookie', result.clearAdminCookie).send({ ok: true });
  });
}
