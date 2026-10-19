import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ConfigRepository } from '../server/config/repository';
import { buildApp } from '../server/app';
import { HomeAssistantUpstreamError } from '../server/home-assistant/errors';

const document = {
  schemaVersion: 1,
  views: [
    {
      id: 'home',
      title: 'Home',
      cards: [
        { type: 'light', entity: 'light.ceiling' },
        { type: 'climate', entity: 'climate.main' },
        { type: 'weather', entity: 'weather.local' },
      ],
    },
  ],
};

async function withApp(
  mode: 'management' | 'direct',
  options: {
    authorized?: boolean;
    expectedOrigin?: string | null;
    staticDirectory?: string;
    upstreamStatus?: number;
  },
  run: (app: Awaited<ReturnType<typeof buildApp>>) => Promise<void>,
) {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-app-'));
  const config = new ConfigRepository({ directory });
  await config.save(config.read()?.revision ?? null, document);
  const app = await buildApp(
    {
      config,
      authorize: () => options.authorized ?? false,
      expectedOrigin: () => options.expectedOrigin ?? 'https://dashboard.example',
      staticDirectory: options.staticDirectory,
      homeAssistant: {
        getState: async (entity) => ({ entity_id: entity, state: 'on' }),
        getStates: async () => {
          if (options.upstreamStatus) {
            throw new HomeAssistantUpstreamError(
              'HA fixture error',
              options.upstreamStatus,
              'HA_FIXTURE',
            );
          }
          return [
            { entity_id: 'light.ceiling', state: 'on' },
            { entity_id: 'light.private', state: 'off' },
          ];
        },
        callService: async (domain) =>
          domain === 'weather'
            ? { service_response: { forecast: [{ temperature: 20 }] } }
            : { context: 'accepted' },
      },
    },
    mode,
  );
  try {
    await run(app);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
}

test('denies by default and never returns configuration to an unauthorized caller', async () => {
  await withApp('direct', {}, async (app) => {
    const response = await app.inject({ method: 'GET', url: '/api/bootstrap' });
    assert.equal(response.statusCode, 401);
    assert.equal(response.headers['cache-control'], 'no-store');
  });
});

test('filters full HA state catalog and permits only a configured single state', async () => {
  await withApp('direct', { authorized: true }, async (app) => {
    const catalog = await app.inject({ method: 'GET', url: '/api/ha/states' });
    assert.equal(catalog.statusCode, 200);
    assert.deepEqual(
      catalog.json().map((state: { entity_id: string }) => state.entity_id),
      ['light.ceiling'],
    );
    assert.equal(
      (await app.inject({ method: 'GET', url: '/api/ha/states/light.private' })).statusCode,
      404,
    );
    assert.equal(
      (await app.inject({ method: 'GET', url: '/api/ha/states/light.ceiling' })).statusCode,
      200,
    );
  });
});

test('requires the application header and exact origin for service calls', async () => {
  await withApp(
    'direct',
    { authorized: true, expectedOrigin: 'https://dashboard.example' },
    async (app) => {
      const base = {
        method: 'POST' as const,
        url: '/api/ha/services/light/turn_on',
        payload: { entity_id: 'light.ceiling' },
      };
      assert.equal((await app.inject(base)).statusCode, 403);
      assert.equal(
        (
          await app.inject({
            ...base,
            headers: { 'x-everdash-request': '1', origin: 'https://attacker.example' },
          })
        ).statusCode,
        403,
      );
      const allowed = await app.inject({
        ...base,
        headers: { 'x-everdash-request': '1', origin: 'https://dashboard.example' },
      });
      assert.equal(allowed.statusCode, 200);
      assert.deepEqual(allowed.json(), { context: 'accepted' });
    },
  );
});

test('rejects unknown service payload fields and unconfigured command targets', async () => {
  await withApp('direct', { authorized: true }, async (app) => {
    const headers = { 'x-everdash-request': '1', origin: 'https://dashboard.example' };
    for (const payload of [
      { entity_id: 'light.ceiling', unexpected: true },
      { entity_id: 'light.private' },
    ]) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ha/services/light/turn_on',
        headers,
        payload,
      });
      assert.equal(response.statusCode, 400);
    }
  });
});

test('preserves climate service calls and the weather forecast response payload', async () => {
  await withApp('direct', { authorized: true }, async (app) => {
    const headers = { 'x-everdash-request': '1', origin: 'https://dashboard.example' };
    const climate = await app.inject({
      method: 'POST',
      url: '/api/ha/services/climate/set_hvac_mode',
      headers,
      payload: { entity_id: 'climate.main', hvac_mode: 'heat' },
    });
    assert.equal(climate.statusCode, 200);
    const weather = await app.inject({
      method: 'POST',
      url: '/api/ha/services/weather/get_forecasts',
      headers,
      payload: { entity_id: 'weather.local', type: 'hourly' },
    });
    assert.deepEqual(weather.json(), { service_response: { forecast: [{ temperature: 20 }] } });
  });
});

test('passes upstream Home Assistant status codes through the API boundary', async () => {
  for (const status of [401, 403, 404]) {
    await withApp('direct', { authorized: true, upstreamStatus: status }, async (app) => {
      const response = await app.inject({ method: 'GET', url: '/api/ha/states' });
      assert.equal(response.statusCode, status);
      assert.equal(response.json().code, 'HA_FIXTURE');
    });
  }
});

test('management APIs cannot be invoked through the direct dashboard listener', async () => {
  await withApp('direct', { authorized: true }, async (app) => {
    assert.equal((await app.inject({ method: 'GET', url: '/api/manage/config' })).statusCode, 403);
  });
});

test('serves only files rooted in the configured static directory', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-static-'));
  const outside = join(directory, 'private.json');
  const publicDirectory = join(directory, 'public');
  await mkdir(publicDirectory);
  await writeFile(join(publicDirectory, 'index.html'), '<main>EverDash</main>');
  await writeFile(outside, '{"secret":true}');
  try {
    await withApp('direct', { staticDirectory: publicDirectory }, async (app) => {
      const home = await app.inject({ method: 'GET', url: '/' });
      assert.equal(home.statusCode, 200);
      assert.match(home.body, /EverDash/);
      const traversal = await app.inject({ method: 'GET', url: '/%2e%2e/private.json' });
      assert.equal(traversal.statusCode, 404);
      assert.equal((await app.inject({ method: 'GET', url: '/api/private.json' })).statusCode, 404);
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
