import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DeviceRepository } from '../server/auth/devices';
import { PairingService } from '../server/auth/pairing';
import { createAuthorizer, DeviceSessions } from '../server/auth/sessions';
import { ConfigRepository } from '../server/config/repository';
import { buildApp } from '../server/app';

const document = { schemaVersion: 1, views: [{ id: 'home', title: 'Home', cards: [] }] };
const expectedOrigin = 'https://dashboard.example';

async function withRuntime(
  run: (args: {
    app: Awaited<ReturnType<typeof buildApp>>;
    devices: DeviceRepository;
    pairing: PairingService;
  }) => Promise<void>,
  mode: 'management' | 'direct' = 'direct',
) {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-auth-'));
  const config = new ConfigRepository({ directory });
  await config.save(config.read()?.revision ?? null, document);
  const devices = new DeviceRepository({ directory });
  const pairing = new PairingService({ devices });
  const app = await buildApp(
    {
      config,
      devices,
      deviceSessions: new DeviceSessions(devices),
      pairing,
      authorize: createAuthorizer(devices),
      expectedOrigin: () => expectedOrigin,
      homeAssistant: {
        getState: async (entityId) => ({ entity_id: entityId, state: 'on' }),
        getStates: async () => [],
        callService: async () => null,
      },
    },
    mode,
  );
  try {
    await run({ app, devices, pairing });
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
}

const mutationHeaders = {
  'x-everdash-request': '1',
  origin: expectedOrigin,
};

test('public listener cannot use forged Ingress identity or a device cookie for management', async () => {
  await withRuntime(async ({ app, devices }) => {
    const { id } = await devices.add('Tablet', 'test-session');
    assert.ok(id);
    const response = await app.inject({
      method: 'GET',
      url: '/api/manage/devices',
      headers: {
        'x-remote-user-id': 'forged-manager',
        cookie: 'everdash_device=test-session',
      },
    });
    assert.equal(response.statusCode, 403);
  });
});

test('untrusted socket peers cannot authenticate to the internal management listener', async () => {
  await withRuntime(async ({ app, devices }) => {
    await devices.add('Tablet', 'test-session');
    const response = await app.inject({
      method: 'GET',
      url: '/api/manage/devices',
      headers: {
        'x-remote-user-id': 'forged-manager',
        cookie: 'everdash_device=test-session',
      },
    });
    assert.equal(response.statusCode, 401);
  }, 'management');
});

test('pairing can be initiated explicitly and redeems to a protected cookie without exposing the token', async () => {
  await withRuntime(async ({ app, pairing, devices }) => {
    const createdResponse = await app.inject({
      method: 'POST',
      url: '/api/pairings',
      headers: mutationHeaders,
      payload: {},
    });
    assert.equal(createdResponse.statusCode, 200);
    const created = createdResponse.json();
    assert.match(created.code, /^[A-HJ-NP-Z2-9]{8}$/);
    assert.equal(createdResponse.headers['cache-control'], 'no-store');
    assert.equal(createdResponse.body.includes('everdash_device='), false);

    await pairing.approve('home-user', created.code, 'Kitchen iPad');
    const redemption = await app.inject({
      method: 'POST',
      url: '/api/pairings/status',
      headers: mutationHeaders,
      payload: { requestId: created.requestId, pollSecret: created.pollSecret },
    });
    assert.equal(redemption.statusCode, 200);
    assert.deepEqual(redemption.json(), {
      status: 'approved',
      deviceId: (await devices.list())[0].id,
    });
    const cookie = redemption.headers['set-cookie'];
    assert.match(
      cookie,
      /^everdash_device=[A-Za-z0-9_-]{43}; Path=\/; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict$/,
    );
    const session = cookie.match(/^everdash_device=([^;]+)/)?.[1] ?? '';
    assert.equal(redemption.body.includes(session), false);
    assert.equal(await devices.authorize(session), true);
    const dashboard = await app.inject({
      method: 'GET',
      url: '/api/bootstrap',
      headers: { cookie },
    });
    assert.equal(dashboard.statusCode, 200);
    const managerPath = await app.inject({
      method: 'GET',
      url: '/api/manage/devices',
      headers: { cookie },
    });
    assert.equal(managerPath.statusCode, 403);
  });
});

test('replayed approval is rejected and logout revokes the next request immediately', async () => {
  await withRuntime(async ({ app, pairing, devices }) => {
    const created = (
      await app.inject({
        method: 'POST',
        url: '/api/pairings',
        headers: mutationHeaders,
        payload: {},
      })
    ).json();
    await pairing.approve('home-user', created.code, 'Office iPad');
    const input = { requestId: created.requestId, pollSecret: created.pollSecret };
    const redeemed = await app.inject({
      method: 'POST',
      url: '/api/pairings/status',
      headers: mutationHeaders,
      payload: input,
    });
    const session = redeemed.headers['set-cookie'].match(/^everdash_device=([^;]+)/)?.[1] ?? '';
    const replay = await app.inject({
      method: 'POST',
      url: '/api/pairings/status',
      headers: mutationHeaders,
      payload: input,
    });
    assert.equal(replay.statusCode, 409);

    const logout = await app.inject({
      method: 'POST',
      url: '/api/logout',
      headers: { ...mutationHeaders, cookie: `everdash_device=${session}` },
      payload: {},
    });
    assert.equal(logout.statusCode, 200);
    assert.match(logout.headers['set-cookie'], /Max-Age=0/);
    const next = await app.inject({
      method: 'GET',
      url: '/api/bootstrap',
      headers: { cookie: `everdash_device=${session}` },
    });
    assert.equal(next.statusCode, 401);
    assert.equal((await devices.list())[0].revokedAt !== null, true);
  });
});
