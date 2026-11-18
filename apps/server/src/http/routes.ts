import type { FastifyInstance, FastifyReply } from 'fastify';
import { validateDashboard } from '@everdash/contracts/config/validate';
import type { ServerDependencies } from '../app';
import { readCookie, TABLET_COOKIE } from '../auth/admin-cookies';
import { filterConfiguredStates, validateServiceCommand } from '../home-assistant/policy';
import { expectedOriginFor, requireTabletAccess } from './access-policy';
import { apiError } from './errors';
import { registerManageRoutes } from './manage-routes';
import { requestSignal } from './request-signal';
import { requireMutationOrigin } from './security';
import {
  registerTabletAccessRoutes,
  registerTabletDeviceManagementRoutes,
} from './tablet-access-routes';

function recoveryError(reply: FastifyReply, message: string) {
  reply.code(503).send(apiError('CONFIG_RECOVERY_REQUIRED', message));
}

export function registerApiRoutes(app: FastifyInstance, dependencies: ServerDependencies) {
  const config = dependencies.config;
  const expectedOrigin = expectedOriginFor(dependencies);

  if (dependencies.ingress) {
    if (dependencies.tabletAccess) {
      registerTabletDeviceManagementRoutes(app, dependencies, dependencies.tabletAccess);
    }
    registerManageRoutes(app, dependencies);
    app.setNotFoundHandler((_request, reply) => {
      reply.code(404).send(apiError('NOT_FOUND', 'The requested endpoint was not found.'));
    });
    return;
  }

  if (dependencies.tabletAccess) {
    registerTabletAccessRoutes(app, dependencies, dependencies.tabletAccess);
  }
  registerManageRoutes(app, dependencies);

  // Tablet dashboard routes.
  app.get('/api/bootstrap', async (request, reply) => {
    if (!requireTabletAccess(request, reply, dependencies)) {
      return;
    }
    if (dependencies.tabletAccess) {
      const session = readCookie(request.headers.cookie, TABLET_COOKIE) ?? '';
      dependencies.tabletAccess.touchSession(session, request.ip);
    }
    const snapshot = config.read();
    if (!snapshot) {
      recoveryError(reply, config.diagnostic?.message ?? 'Dashboard configuration needs recovery.');
      return;
    }
    return {
      mode: 'direct',
      configured: config.isConfigured,
      revision: snapshot.revision,
      config: snapshot.config,
    };
  });

  app.get('/api/ha/states', async (request, reply) => {
    if (!requireTabletAccess(request, reply, dependencies)) {
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
      await dependencies.homeAssistant.getStates(requestSignal(request, reply)),
      parsed.config,
    );
  });

  app.get<{ Params: { entityId: string } }>('/api/ha/states/:entityId', async (request, reply) => {
    if (!requireTabletAccess(request, reply, dependencies)) {
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
    return dependencies.homeAssistant.getState(
      request.params.entityId,
      requestSignal(request, reply),
    );
  });

  app.post<{ Params: { domain: string; service: string } }>(
    '/api/ha/services/:domain/:service',
    async (request, reply) => {
      if (!requireTabletAccess(request, reply, dependencies)) {
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
        requestSignal(request, reply),
      );
    },
  );

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send(apiError('NOT_FOUND', 'The requested endpoint was not found.'));
  });
}
