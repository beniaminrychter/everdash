import type { FastifyInstance } from 'fastify';
import type { ServerDependencies } from '../app';
import { filterConfiguredStates } from '../home-assistant/policy';
import { expectedOriginFor, requireAdminAccess } from './access-policy';
import { apiError } from './errors';
import { requestSignal } from './request-signal';
import { requireMutationOrigin } from './security';

/** Administrator routes used by the visual dashboard editor. */
export function registerManageRoutes(app: FastifyInstance, dependencies: ServerDependencies) {
  const config = dependencies.config;
  const expectedOrigin = expectedOriginFor(dependencies);

  app.get('/api/manage/access', async (request, reply) => {
    if (!requireAdminAccess(request, reply, dependencies)) {
      return;
    }
    return { status: dependencies.tabletAccess?.status() ?? 'open' };
  });

  app.get<{ Querystring: { q?: string; domain?: string; limit?: string } }>(
    '/api/manage/entities',
    async (request, reply) => {
      if (!requireAdminAccess(request, reply, dependencies)) {
        return;
      }
      const query = request.query.q?.trim() ?? '';
      const domain = request.query.domain?.trim() ?? '';
      const domains = domain ? domain.split(',') : [];
      const rawLimit = request.query.limit ?? '50';
      const limit = Number(rawLimit);
      if (
        query.length > 120 ||
        (domain && !/^[a-z_]{1,32}(,[a-z_]{1,32}){0,4}$/.test(domain)) ||
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
      const raw = await dependencies.homeAssistant.getStates(requestSignal(request, reply));
      if (!Array.isArray(raw)) {
        reply
          .code(502)
          .send(apiError('HA_INVALID_CATALOG', 'Home Assistant returned an invalid entity list.'));
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
        if (domains.length > 0 && !domains.includes(entityDomain)) {
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
    if (!requireAdminAccess(request, reply, dependencies)) {
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
    const signal = requestSignal(request, reply);
    const weatherEntities = Array.from(
      new Set(
        validation.config.views.flatMap((view) =>
          view.cards.filter((card) => card.type === 'weather').map((card) => card.entity),
        ),
      ),
    );
    const [states, forecastResults] = await Promise.all([
      dependencies.homeAssistant.getStates(signal),
      Promise.all(
        weatherEntities.map(async (entityId) => {
          try {
            const result = await dependencies.homeAssistant.callService(
              'weather',
              'get_forecasts',
              { entity_id: entityId, type: 'hourly' },
              signal,
            );
            if (
              typeof result !== 'object' ||
              result === null ||
              !('service_response' in result) ||
              typeof result.service_response !== 'object' ||
              result.service_response === null
            ) {
              return [entityId, []] as const;
            }
            const response = result.service_response as Record<string, unknown>;
            const entity = response[entityId];
            if (typeof entity !== 'object' || entity === null || !('forecast' in entity)) {
              return [entityId, []] as const;
            }
            const forecast = (entity as { forecast?: unknown }).forecast;
            return [entityId, Array.isArray(forecast) ? forecast : []] as const;
          } catch {
            return [entityId, []] as const;
          }
        }),
      ),
    ]);
    return {
      config: validation.document,
      states: filterConfiguredStates(states, validation.config),
      forecasts: Object.fromEntries(forecastResults),
    };
  });

  app.get('/api/manage/config', async (request, reply) => {
    if (!requireAdminAccess(request, reply, dependencies)) {
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
      if (!requireAdminAccess(request, reply, dependencies)) {
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
      if (!requireAdminAccess(request, reply, dependencies)) {
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
    if (!requireAdminAccess(request, reply, dependencies)) {
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
}
