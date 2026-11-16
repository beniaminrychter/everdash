import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildApp } from '../apps/server/src/app';
import { ConfigRepository } from '../apps/server/src/config/repository';

const replacement = {
  schemaVersion: 1,
  views: [{ id: 'home', title: 'Home', cards: [{ type: 'light', entity: 'light.kitchen' }] }],
};

test('management can replace damaged config through a validated recovery save', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-recovery-'));
  await writeFile(join(directory, 'dashboard.json'), '{broken');
  const config = new ConfigRepository({ directory });
  const app = await buildApp({
    config,
    access: { isAdmin: () => true, isTablet: () => true },
    expectedOrigin: () => 'http://ha.local',
    homeAssistant: {
      getState: async () => ({}),
      getStates: async () => [],
      callService: async () => null,
    },
  });
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

test('preview forecasts follow each weather card: its type, or the one its entity offers', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-preview-'));
  const forecastRequests: unknown[] = [];
  const states = [
    { entity_id: 'weather.both', state: 'sunny', attributes: { supported_features: 3 } },
    { entity_id: 'weather.hourly', state: 'sunny', attributes: { supported_features: 2 } },
    { entity_id: 'weather.twice', state: 'sunny', attributes: { supported_features: 4 } },
  ];
  const app = await buildApp({
    config: new ConfigRepository({ directory }),
    access: { isAdmin: () => true, isTablet: () => true },
    expectedOrigin: () => 'http://ha.local',
    homeAssistant: {
      getState: async () => ({}),
      getStates: async () => states,
      callService: async (_domain, _service, data) => {
        forecastRequests.push(data);
        const { entity_id: id, type } = data as { entity_id: string; type: string };
        return { service_response: { [id]: { forecast: [{ type }] } } };
      },
    },
  });
  try {
    const response = await app.inject({
      method: 'POST',
      url: '/api/manage/preview',
      headers: { origin: 'http://ha.local', 'x-everdash-request': '1' },
      payload: {
        config: {
          schemaVersion: 1,
          views: [
            {
              id: 'home',
              title: 'Home',
              cards: [
                { type: 'weather', entity: 'weather.both', forecast: 'daily' },
                { type: 'weather', entity: 'weather.hourly', forecast: 'daily' },
                { type: 'weather', entity: 'weather.twice' },
              ],
            },
          ],
        },
      },
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().forecasts, {
      'weather.both#daily': [{ type: 'daily' }],
      'weather.hourly#daily': [{ type: 'hourly' }],
    });
    assert.deepEqual(forecastRequests, [
      { entity_id: 'weather.both', type: 'daily' },
      { entity_id: 'weather.hourly', type: 'hourly' },
    ]);
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
  const app = await buildApp({
    config: new ConfigRepository({ directory }),
    access: { isAdmin: () => true, isTablet: () => true },
    expectedOrigin: () => 'http://ha.local',
    homeAssistant: {
      getState: async () => ({}),
      getStates: async () => [
        { entity_id: 'light.kitchen', state: 'on', attributes: { friendly_name: 'Kitchen' } },
        { entity_id: 'light.private', state: 'off', attributes: { friendly_name: 'Private' } },
        {
          entity_id: 'weather.home',
          state: 'sunny',
          attributes: { friendly_name: 'Home', supported_features: 3 },
        },
      ],
      callService: async (domain, service, data) => {
        if (domain === 'weather' && service === 'get_forecasts') {
          forecastRequests.push(data);
          return {
            service_response: {
              'weather.home': {
                forecast: [
                  {
                    datetime: '2026-10-20T12:00:00Z',
                    temperature: 18,
                    forecastType: (data as { type: string }).type,
                  },
                ],
              },
            },
          };
        }
        deviceCommands++;
        return null;
      },
    },
  });
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
    // An hourly card also reads the daily forecast, for today's high and low.
    assert.deepEqual(response.json().forecasts, {
      'weather.home#daily': [
        { datetime: '2026-10-20T12:00:00Z', temperature: 18, forecastType: 'daily' },
      ],
      'weather.home#hourly': [
        { datetime: '2026-10-20T12:00:00Z', temperature: 18, forecastType: 'hourly' },
      ],
    });
    assert.deepEqual(forecastRequests, [
      { entity_id: 'weather.home', type: 'hourly' },
      { entity_id: 'weather.home', type: 'daily' },
    ]);
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
