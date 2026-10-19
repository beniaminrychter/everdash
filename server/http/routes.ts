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
        reply.header(
          'Set-Cookie',
          deviceCookie(
            result.session,
            dependencies.secureCookies !== false,
            dependencies.deviceCookieName,
          ),
        );
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
    const cookieName = dependencies.deviceCookieName;
    const session = readDeviceCookie(request.headers.cookie, cookieName);
    if (listenerMode === 'direct' && session && dependencies.deviceSessions) {
      await dependencies.deviceSessions.logout(session);
    }
    reply.header(
      'Set-Cookie',
      expiredDeviceCookie(dependencies.secureCookies !== false, cookieName),
    );
    return { success: true };
  });

  if (listenerMode === 'management') {
    app.get('/api/manage/access', async (request, reply) => {
      if (!(await verifyAuthorized(request, reply, dependencies, 'management'))) {
        return;
      }
      if (!dependencies.getAccessInfo) {
        return {
          hostName: null,
          addresses: [],
          httpPort: null,
          httpsPort: null,
          errors: ['Home Assistant network discovery is not available.'],
        };
      }
      return dependencies.getAccessInfo();
    });

    app.get<{ Querystring: { q?: string; domain?: string; limit?: string } }>(
      '/api/manage/entities',
      async (request, reply) => {
        if (!(await verifyAuthorized(request, reply, dependencies, 'management'))) {
          return;
        }
        const query = request.query.q?.trim() ?? '';
        const domain = request.query.domain?.trim() ?? '';
        const rawLimit = request.query.limit ?? '50';
        const limit = Number(rawLimit);
        if (
          query.length > 120 ||
          (domain && !/^[a-z_]{1,32}$/.test(domain)) ||
          !/^\d{1,3}$/.test(rawLimit) ||
          !Number.isInteger(limit) ||
          limit < 1 ||
          limit > 100
        ) {
          reply
            .code(400)
            .send(apiError('INVALID_ENTITY_QUERY', 'Entity search parameters are invalid.'));
          return;
        }
        const raw = await dependencies.homeAssistant.getStates(requestSignal(request));
        if (!Array.isArray(raw)) {
          reply
            .code(502)
            .send(
              apiError('HA_INVALID_CATALOG', 'Home Assistant returned an invalid entity list.'),
            );
          return;
        }
        const needle = query.toLocaleLowerCase();
        const entities = raw.flatMap((candidate) => {
          if (typeof candidate !== 'object' || candidate === null || !('entity_id' in candidate)) {
            return [];
          }
          const entity = candidate as {
            entity_id?: unknown;
            state?: unknown;
            attributes?: Record<string, unknown>;
          };
          if (
            typeof entity.entity_id !== 'string' ||
            !/^[a-z_]+\.[a-z0-9_]+$/.test(entity.entity_id)
          ) {
            return [];
          }
          const [entityDomain] = entity.entity_id.split('.');
          if (domain && entityDomain !== domain) {
            return [];
          }
          const attributes = entity.attributes ?? {};
          const name =
            typeof attributes.friendly_name === 'string' && attributes.friendly_name.trim()
              ? attributes.friendly_name.trim().slice(0, 120)
              : entity.entity_id;
          if (
            needle &&
            !entity.entity_id.toLocaleLowerCase().includes(needle) &&
            !name.toLocaleLowerCase().includes(needle)
          ) {
            return [];
          }
          const rawState = typeof entity.state === 'string' ? entity.state.toLowerCase() : '';
          const available = rawState !== 'unavailable' && rawState !== 'unknown' && rawState !== '';
          return [
            {
              entityId: entity.entity_id,
              name,
              domain: entityDomain,
              state: available ? 'Available' : rawState,
              available,
              unit:
                typeof attributes.unit_of_measurement === 'string'
                  ? attributes.unit_of_measurement.slice(0, 32)
                  : null,
              deviceClass:
                typeof attributes.device_class === 'string'
                  ? attributes.device_class.slice(0, 64)
                  : null,
              icon: typeof attributes.icon === 'string' ? attributes.icon.slice(0, 80) : null,
            },
          ];
        });
        entities.sort((left, right) => left.name.localeCompare(right.name));
        return { entities: entities.slice(0, limit), total: entities.length };
      },
    );

    app.post<{ Body: { config?: unknown } }>('/api/manage/preview', async (request, reply) => {
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
      const states = await dependencies.homeAssistant.getStates(requestSignal(request));
      return {
        config: validation.document,
        states: filterConfiguredStates(states, validation.config),
      };
    });

    app.get('/api/manage/config', async (request, reply) => {
      if (!(await verifyAuthorized(request, reply, dependencies, 'management'))) {
        return;
      }
      const snapshot = config.read();
      if (!snapshot) {
        return {
          revision: null,
          config: {
            schemaVersion: 1,
            views: [{ id: 'home', title: 'Home', cards: [], badges: [] }],
          },
          previousAvailable: config.readPrevious() !== null,
          configured: false,
          recovery: true,
          diagnostic: config.diagnostic?.message ?? 'Create and save a dashboard to finish setup.',
        };
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
        if (baseRevision === null && !config.read()) {
          return config.recover(input);
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
