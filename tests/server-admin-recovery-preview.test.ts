import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildApp } from '../server/app';
import { ConfigRepository } from '../server/config/repository';

const replacement = {
  schemaVersion: 1,
  views: [{ id: 'home', title: 'Home', cards: [{ type: 'light', entity: 'light.kitchen' }] }],
};

test('management can replace damaged config through a validated recovery save', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-recovery-'));
  await writeFile(join(directory, 'dashboard.json'), '{broken');
  const config = new ConfigRepository({ directory });
  const app = await buildApp(
    {
      config,
      authorize: async (_request, mode) => mode === 'management',
      expectedOrigin: () => 'http://ha.local',
      homeAssistant: {
        getState: async () => ({}),
        getStates: async () => [],
        callService: async () => null,
      },
    },
    'management',
  );
  const headers = { origin: 'http://ha.local', 'x-everdash-request': '1' };
  try {
    const loaded = await app.inject('/api/manage/config');
    assert.equal(loaded.statusCode, 200);
    assert.equal(loaded.json().recovery, true);
    const saved = await app.inject({
      method: 'PUT',
      url: '/api/manage/config',
      headers,
      payload: { baseRevision: null, config: replacement },
    });
    assert.equal(saved.statusCode, 200);
    assert.deepEqual(config.read()?.config.views[0]?.cards[0], replacement.views[0]?.cards[0]);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('preview endpoint validates the draft and returns only its configured states', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-preview-'));
  let deviceCommands = 0;
  const forecastRequests: unknown[] = [];
  const previewDocument = {
    schemaVersion: 1,
    views: [
      {
        id: 'home',
        title: 'Home',
        cards: [
          { type: 'light', entity: 'light.kitchen' },
          { type: 'weather', entity: 'weather.home' },
        ],
      },
    ],
  };
  const app = await buildApp(
    {
      config: new ConfigRepository({ directory }),
      authorize: async (_request, mode) => mode === 'management',
      expectedOrigin: () => 'http://ha.local',
      homeAssistant: {
        getState: async () => ({}),
        getStates: async () => [
          { entity_id: 'light.kitchen', state: 'on', attributes: { friendly_name: 'Kitchen' } },
          { entity_id: 'light.private', state: 'off', attributes: { friendly_name: 'Private' } },
          { entity_id: 'weather.home', state: 'sunny', attributes: { friendly_name: 'Home' } },
        ],
        callService: async (domain, service, data) => {
          if (domain === 'weather' && service === 'get_forecasts') {
            forecastRequests.push(data);
            return {
              service_response: {
                'weather.home': {
                  forecast: [{ datetime: '2026-10-20T12:00:00Z', temperature: 18 }],
                },
              },
            };
          }
          deviceCommands++;
          return null;
        },
      },
    },
    'management',
  );
  try {
    const headers = { origin: 'http://ha.local', 'x-everdash-request': '1' };
    const response = await app.inject({
      method: 'POST',
      url: '/api/manage/preview',
      headers,
      payload: { config: previewDocument },
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(
      response.json().states.map((item: { entity_id: string }) => item.entity_id),
      ['light.kitchen', 'weather.home'],
    );
    assert.deepEqual(response.json().forecasts, {
      'weather.home': [{ datetime: '2026-10-20T12:00:00Z', temperature: 18 }],
    });
    assert.deepEqual(forecastRequests, [{ entity_id: 'weather.home', type: 'hourly' }]);
    assert.equal(deviceCommands, 0);
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/manage/preview',
          headers,
          payload: { config: { schemaVersion: 77 } },
        })
      ).statusCode,
      422,
    );
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
