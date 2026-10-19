import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { validateDashboard } from '../../src/shared/config/validate';
import type { ServerDependencies } from '../app';
import { getIngressUserId } from '../auth/ingress';
import { deviceCookie, expiredDeviceCookie, readDeviceCookie } from '../auth/sessions';
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
    reply.code(401).send({
      ...apiError('UNAUTHORIZED', 'Pair this device or open EverDash through Home Assistant.'),
      mode: listenerMode,
    });
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

  app.post('/api/pairings', async (request, reply) => {
    if (listenerMode !== 'direct') {
      reply
        .code(403)
        .send(apiError('PAIRING_DIRECT_ONLY', 'Pairing is available on the direct dashboard URL.'));
      return;
    }
    if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
      return;
    }
    if (!dependencies.pairing) {
      reply.code(503).send(apiError('PAIRING_UNAVAILABLE', 'Pairing is not available yet.'));
      return;
    }
    const peerIp = request.raw.socket.remoteAddress ?? 'unknown';
    return dependencies.pairing.create(peerIp);
  });

  app.post<{ Body: { requestId?: string; pollSecret?: string } }>(
    '/api/pairings/status',
    async (request, reply) => {
      if (listenerMode !== 'direct') {
        reply
          .code(403)
          .send(
            apiError('PAIRING_DIRECT_ONLY', 'Pairing is available on the direct dashboard URL.'),
          );
        return;
      }
      if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
        return;
      }
      if (!dependencies.pairing) {
        reply.code(503).send(apiError('PAIRING_UNAVAILABLE', 'Pairing is not available yet.'));
        return;
      }
      const { requestId, pollSecret } = request.body ?? {};
      if (typeof requestId !== 'string' || typeof pollSecret !== 'string') {
        reply
          .code(400)
          .send(apiError('INVALID_PAIRING_REQUEST', 'A request ID and poll secret are required.'));
        return;
      }
      const result = await dependencies.pairing.status(requestId, pollSecret);
      if (result.status === 'approved') {
        reply.header('Set-Cookie', deviceCookie(result.session));
        return { status: 'approved', deviceId: result.deviceId };
      }
      return result;
    },
  );

  app.post('/api/logout', async (request, reply) => {
    if (!(await authorize(request, reply))) {
      return;
    }
    if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
      return;
    }
    const session = readDeviceCookie(request.headers.cookie);
    if (listenerMode === 'direct' && session && dependencies.deviceSessions) {
      await dependencies.deviceSessions.logout(session);
    }
    reply.header('Set-Cookie', expiredDeviceCookie());
    return { success: true };
  });

  if (listenerMode === 'management') {
    app.get('/api/manage/config', async (request, reply) => {
      if (!(await verifyAuthorized(request, reply, dependencies, 'management'))) {
        return;
      }
      const snapshot = config.read();
      if (!snapshot) {
        recoveryError(
          reply,
          config.diagnostic?.message ?? 'Dashboard configuration needs recovery.',
        );
        return;
      }
      return {
        revision: snapshot.revision,
        config: snapshot.config,
        previousAvailable: config.readPrevious() !== null,
        configured: config.isConfigured,
      };
    });

    app.post<{ Body: { config?: unknown } }>(
      '/api/manage/config/validate',
      async (request, reply) => {
        if (!(await verifyAuthorized(request, reply, dependencies, 'management'))) {
          return;
        }
        if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
          return;
        }
        const validation = config.validate(request.body?.config);
        if (!validation.ok) {
          reply
            .code(422)
            .send(apiError('CONFIG_INVALID', 'Dashboard validation failed.', validation.issues));
          return;
        }
        return { config: validation.document, normalized: validation.config };
      },
    );

    app.put<{ Body: { baseRevision?: string | null; config?: unknown } }>(
      '/api/manage/config',
      async (request, reply) => {
        if (!(await verifyAuthorized(request, reply, dependencies, 'management'))) {
          return;
        }
        if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
          return;
        }
        const { baseRevision, config: input } = request.body ?? {};
        if (baseRevision !== null && typeof baseRevision !== 'string') {
          reply.code(400).send(apiError('INVALID_CONFIG_REQUEST', 'A base revision is required.'));
          return;
        }
        return config.save(baseRevision, input);
      },
    );

    app.get('/api/manage/config/previous', async (request, reply) => {
      if (!(await verifyAuthorized(request, reply, dependencies, 'management'))) {
        return;
      }
      const previous = config.readPrevious();
      if (!previous) {
        reply
          .code(404)
          .send(apiError('CONFIG_PREVIOUS_NOT_FOUND', 'No previous dashboard is available.'));
        return;
      }
      return { config: previous };
    });

    app.get('/api/manage/devices', async (request, reply) => {
      if (!(await authorize(request, reply))) {
        return;
      }
      if (!dependencies.devices) {
        reply
          .code(503)
          .send(apiError('DEVICE_STORAGE_UNAVAILABLE', 'Device storage is unavailable.'));
        return;
      }
      return dependencies.devices.list();
    });

    app.post<{ Body: { code?: string; label?: string } }>(
      '/api/manage/pairings/approve',
      async (request, reply) => {
        if (!(await authorize(request, reply))) {
          return;
        }
        if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
          return;
        }
        if (!dependencies.pairing) {
          reply.code(503).send(apiError('PAIRING_UNAVAILABLE', 'Pairing is unavailable.'));
          return;
        }
        const userId = getIngressUserId({
          headers: request.headers,
          socket: { remoteAddress: request.raw.socket.remoteAddress },
        });
        if (!userId) {
          reply.code(401).send(apiError('UNAUTHORIZED', 'Open EverDash through Home Assistant.'));
          return;
        }
        const { code, label } = request.body ?? {};
        if (typeof code !== 'string' || typeof label !== 'string') {
          reply
            .code(400)
            .send(
              apiError('INVALID_PAIRING_REQUEST', 'A pairing code and device label are required.'),
            );
          return;
        }
        await dependencies.pairing.approve(userId, code, label);
        return { approved: true };
      },
    );

    app.delete<{ Params: { id: string } }>('/api/manage/devices/:id', async (request, reply) => {
      if (!(await authorize(request, reply))) {
        return;
      }
      if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
        return;
      }
      if (!dependencies.devices) {
        reply
          .code(503)
          .send(apiError('DEVICE_STORAGE_UNAVAILABLE', 'Device storage is unavailable.'));
        return;
      }
      if (!/^[a-f0-9]{32}$/.test(request.params.id)) {
        reply.code(404).send(apiError('DEVICE_NOT_FOUND', 'Device was not found.'));
        return;
      }
      if (!(await dependencies.devices.revoke(request.params.id))) {
        reply.code(404).send(apiError('DEVICE_NOT_FOUND', 'Device was not found.'));
        return;
      }
      return { revoked: true };
    });
  }

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
