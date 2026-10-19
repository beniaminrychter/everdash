import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { validateDashboard } from '../../src/shared/config/validate';
import type { ServerDependencies } from '../app';
import { filterConfiguredStates, validateServiceCommand } from '../home-assistant/policy';
import { apiError } from './errors';
import { requireMutationOrigin } from './security';

function requestSignal(request: FastifyRequest): AbortSignal {
  const controller = new AbortController();
  request.raw.once('aborted', () => controller.abort());
  return controller.signal;
}

async function verifyAuthorized(
  request: FastifyRequest,
  reply: FastifyReply,
  dependencies: ServerDependencies,
  listenerMode: 'management' | 'direct',
): Promise<boolean> {
  if (!(await (dependencies.authorize?.(request, listenerMode) ?? false))) {
    reply
      .code(401)
      .send(apiError('UNAUTHORIZED', 'Pair this device or open EverDash through Home Assistant.'));
    return false;
  }
  return true;
}

function recoveryError(reply: FastifyReply, message: string) {
  reply.code(503).send(apiError('CONFIG_RECOVERY_REQUIRED', message));
}

export function registerApiRoutes(
  app: FastifyInstance,
  dependencies: ServerDependencies,
  listenerMode: 'management' | 'direct',
) {
  const config = dependencies.config;
  const authorize = (request: FastifyRequest, reply: FastifyReply) =>
    verifyAuthorized(request, reply, dependencies, listenerMode);
  const expectedOrigin = (request: FastifyRequest) =>
    dependencies.expectedOrigin?.(request, listenerMode) ?? null;

  app.get('/api/bootstrap', async (request, reply) => {
    if (!(await authorize(request, reply))) {
      return;
    }
    const snapshot = config.read();
    if (!snapshot) {
      recoveryError(reply, config.diagnostic?.message ?? 'Dashboard configuration needs recovery.');
      return;
    }
    return {
      mode: listenerMode,
      configured: config.isConfigured,
      revision: snapshot.revision,
      config: snapshot.config,
    };
  });

  app.get('/api/ha/states', async (request, reply) => {
    if (!(await authorize(request, reply))) {
      return;
    }
    const snapshot = config.read();
    if (!snapshot) {
      recoveryError(reply, config.diagnostic?.message ?? 'Dashboard configuration needs recovery.');
      return;
    }
    const parsed = validateDashboard(snapshot.config);
    if (!parsed.ok) {
      recoveryError(reply, 'Dashboard configuration needs recovery.');
      return;
    }
    return filterConfiguredStates(
      await dependencies.homeAssistant.getStates(requestSignal(request)),
      parsed.config,
    );
  });

  app.get<{ Params: { entityId: string } }>('/api/ha/states/:entityId', async (request, reply) => {
    if (!(await authorize(request, reply))) {
      return;
    }
    if (!/^[a-z_]+\.[a-z0-9_]+$/.test(request.params.entityId)) {
      reply.code(400).send(apiError('INVALID_ENTITY_ID', 'Entity ID is invalid.'));
      return;
    }
    const snapshot = config.read();
    if (!snapshot) {
      recoveryError(reply, 'Dashboard configuration needs recovery.');
      return;
    }
    const parsed = validateDashboard(snapshot.config);
    if (
      !parsed.ok ||
      !filterConfiguredStates([{ entity_id: request.params.entityId }], parsed.config).length
    ) {
      reply
        .code(404)
        .send(apiError('ENTITY_NOT_CONFIGURED', 'Entity is not configured in this dashboard.'));
      return;
    }
    return dependencies.homeAssistant.getState(request.params.entityId, requestSignal(request));
  });

  app.post<{ Params: { domain: string; service: string } }>(
    '/api/ha/services/:domain/:service',
    async (request, reply) => {
      if (!(await authorize(request, reply))) {
        return;
      }
      if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
        return;
      }
      const snapshot = config.read();
      if (!snapshot) {
        recoveryError(reply, 'Dashboard configuration needs recovery.');
        return;
      }
      const parsed = validateDashboard(snapshot.config);
      if (!parsed.ok) {
        recoveryError(reply, 'Dashboard configuration needs recovery.');
        return;
      }
      const data = validateServiceCommand(
        request.params.domain,
        request.params.service,
        request.body,
        parsed.config,
      );
      return dependencies.homeAssistant.callService(
        request.params.domain,
        request.params.service,
        data,
        requestSignal(request),
      );
    },
  );

  app.setNotFoundHandler((request, reply) => {
    if (listenerMode === 'direct' && request.url.startsWith('/api/manage')) {
      reply
        .code(403)
        .send(
          apiError(
            'MANAGEMENT_FORBIDDEN',
            'Management is available through Home Assistant Ingress.',
          ),
        );
      return;
    }
    reply.code(404).send(apiError('NOT_FOUND', 'The requested endpoint was not found.'));
  });
}
