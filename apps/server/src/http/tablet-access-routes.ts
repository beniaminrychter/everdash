import type { FastifyInstance } from 'fastify';
import type { ServerDependencies } from '../app';
import { readCookie } from '../auth/admin-cookies';
import type { TabletAccess } from '../auth/tablet-access';
import { expectedOriginFor, requireAdminAccess } from './access-policy';
import { apiError } from './errors';
import { requireMutationOrigin } from './security';

/** Tablet PIN status, unlock/lock, and the admin PIN setting. */
export function registerTabletAccessRoutes(
  app: FastifyInstance,
  dependencies: ServerDependencies,
  access: TabletAccess,
) {
  const expectedOrigin = expectedOriginFor(dependencies);
  const failures = new Map<string, number[]>();
  const pendingByAddress = new Map<string, number>();
  let pending = 0;
  app.get('/api/access', async (request, reply) =>
    reply.send({
      status:
        access.status() === 'pin_required' &&
        access.authorized(readCookie(request.headers.cookie, 'everdash_tablet') ?? '')
          ? 'unlocked'
          : access.status(),
    }),
  );
  app.post<{ Body: { pin?: unknown } }>('/api/access/unlock', async (request, reply) => {
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
      (failures.get(address)?.length ?? 0) + (pendingByAddress.get(address) ?? 0) >= 5 ||
      (failures.get('global')?.length ?? 0) + pending >= 50 ||
      pending >= 4 ||
      failures.size >= 1000
    ) {
      return reply
        .header('Retry-After', '60')
        .code(429)
        .send(apiError('RATE_LIMITED', 'Try again later.'));
    }
    pending += 1;
    pendingByAddress.set(address, (pendingByAddress.get(address) ?? 0) + 1);
    let session: string | null;
    try {
      session = await access.unlock(typeof request.body?.pin === 'string' ? request.body.pin : '');
    } finally {
      pending -= 1;
      const remaining = (pendingByAddress.get(address) ?? 1) - 1;
      if (remaining) {
        pendingByAddress.set(address, remaining);
      } else {
        pendingByAddress.delete(address);
      }
    }
    if (!session) {
      failures.set(address, [...(failures.get(address) ?? []), now]);
      failures.set('global', [...(failures.get('global') ?? []), now]);
      return reply.code(401).send(apiError('INVALID_PIN', 'Invalid PIN.'));
    }
    const secure = request.protocol === 'https' ? '; Secure' : '';
    return reply
      .header(
        'Set-Cookie',
        `everdash_tablet=${session}; Path=/api; HttpOnly; SameSite=Strict${secure}`,
      )
      .send({ ok: true });
  });
  app.post('/api/access/lock', async (request, reply) => {
    if (!(await requireMutationOrigin(request, reply, expectedOrigin))) {
      return;
    }
    const secure = request.protocol === 'https' ? '; Secure' : '';
    return reply
      .header(
        'Set-Cookie',
        `everdash_tablet=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
      )
      .send({ ok: true });
  });
  app.put<{ Body: { pin?: unknown } }>('/api/manage/access', async (request, reply) => {
    if (
      !requireAdminAccess(request, reply, dependencies) ||
      !(await requireMutationOrigin(request, reply, expectedOrigin))
    ) {
      return;
    }
    const pin = request.body?.pin;
    if (pin !== null && (typeof pin !== 'string' || !/^[0-9]{4,6}$/.test(pin))) {
      return reply.code(400).send(apiError('INVALID_PIN', 'PIN must contain four to six digits.'));
    }
    await access.setPin(pin);
    return { status: access.status() };
  });
}
