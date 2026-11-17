import type { FastifyInstance } from 'fastify';
import type { ServerDependencies } from '../app';
import { clearTabletCookie, readCookie, TABLET_COOKIE, tabletCookie } from '../auth/admin-cookies';
import type { TabletAccess } from '../auth/tablet-access';
import { expectedOriginFor, requireAdminAccess } from './access-policy';
import { apiError } from './errors';
import { requireMutationOrigin } from './security';

/** Device registration status, registration/unregistration, and admin device management. */
export function registerTabletAccessRoutes(
  app: FastifyInstance,
  dependencies: ServerDependencies,
  access: TabletAccess,
) {
  const expectedOrigin = expectedOriginFor(dependencies);
  const failures = new Map<string, number[]>();

  app.get('/api/access', async (request, reply) => {
    const session = readCookie(request.headers.cookie, TABLET_COOKIE) ?? '';
    if (access.authorized(session)) {
      access.touchSession(session, request.ip);
      return reply.send({ status: 'registered' });
    }
    return reply.send({ status: access.status() });
  });

  app.post<{ Body: { code?: unknown; deviceType?: unknown; screenSize?: unknown } }>(
    '/api/access/register',
    async (request, reply) => {
      if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
        return;
      }
      const now = Date.now();
      for (const [key, values] of failures) {
        const recent = values.filter((value) => now - value < 60_000);
        if (recent.length) {
          failures.set(key, recent);
        } else {
          failures.delete(key);
        }
      }
      const address = `ip:${request.ip}`;
      if (
        (failures.get(address)?.length ?? 0) >= 5 ||
        (failures.get('global')?.length ?? 0) >= 50 ||
        failures.size >= 1000
      ) {
        return reply
          .header('Retry-After', '60')
          .code(429)
          .send(apiError('RATE_LIMITED', 'Try again later.'));
      }

      const code = typeof request.body?.code === 'string' ? request.body.code.trim() : '';
      const registered = access.registerDevice(code, {
        ip: request.ip,
        deviceType: request.body?.deviceType,
        screenSize: request.body?.screenSize,
        userAgent: request.headers['user-agent'],
      });
      if (!registered) {
        failures.set(address, [...(failures.get(address) ?? []), now]);
        failures.set('global', [...(failures.get('global') ?? []), now]);
        return reply
          .code(401)
          .send(apiError('INVALID_REGISTRATION_CODE', 'Invalid registration code.'));
      }

      return reply
        .header('Set-Cookie', tabletCookie(registered.session, request.protocol === 'https'))
        .send({ ok: true, deviceId: registered.device.id });
    },
  );

  app.post('/api/access/unregister', async (request, reply) => {
    if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
      return;
    }
    const session = readCookie(request.headers.cookie, TABLET_COOKIE) ?? '';
    if (session) {
      access.removeDeviceBySession(session);
    }
    return reply
      .header('Set-Cookie', clearTabletCookie(request.protocol === 'https'))
      .send({ ok: true });
  });

  app.get('/api/manage/devices', async (request, reply) => {
    if (!requireAdminAccess(request, reply, dependencies)) {
      return;
    }
    return access.overview();
  });

  app.post('/api/manage/devices/code', async (request, reply) => {
    if (
      !requireAdminAccess(request, reply, dependencies) ||
      !(await requireMutationOrigin(request, reply, expectedOrigin))
    ) {
      return;
    }
    return access.regenerateCode();
  });

  app.patch<{ Params: { id: string }; Body: { name?: unknown } }>(
    '/api/manage/devices/:id',
    async (request, reply) => {
      if (
        !requireAdminAccess(request, reply, dependencies) ||
        !(await requireMutationOrigin(request, reply, expectedOrigin))
      ) {
        return;
      }
      if (typeof request.body?.name !== 'string' || request.body.name.trim().length > 80) {
        return reply
          .code(400)
          .send(apiError('INVALID_DEVICE_NAME', 'Device name must be 80 characters or fewer.'));
      }
      const device = access.renameDevice(request.params.id, request.body.name);
      if (!device) {
        return reply.code(404).send(apiError('DEVICE_NOT_FOUND', 'Device not found.'));
      }
      return { device };
    },
  );

  app.delete<{ Params: { id: string } }>('/api/manage/devices/:id', async (request, reply) => {
    if (
      !requireAdminAccess(request, reply, dependencies) ||
      !(await requireMutationOrigin(request, reply, expectedOrigin))
    ) {
      return;
    }
    if (!access.removeDevice(request.params.id)) {
      return reply.code(404).send(apiError('DEVICE_NOT_FOUND', 'Device not found.'));
    }
    return { ok: true };
  });
}
