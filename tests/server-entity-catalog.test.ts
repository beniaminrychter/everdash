import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildApp } from '../server/app';
import { ConfigRepository } from '../server/config/repository';

test('management entity search is bounded, domain filtered and returns builder metadata only', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-entities-'));
  const app = await buildApp(
    {
      config: new ConfigRepository({ directory }),
      authorize: async (_request, mode) => mode === 'management',
      homeAssistant: {
        getState: async () => ({}),
        getStates: async () => [
          {
            entity_id: 'light.kitchen',
            state: 'unavailable',
            attributes: {
              friendly_name: 'Kitchen Pendant',
              unit_of_measurement: 'W',
              device_class: 'power',
              icon: 'mdi:lightbulb',
              secret_attribute: 'never expose',
            },
          },
          {
            entity_id: 'sensor.kitchen_temperature',
            state: '21.5',
            attributes: { friendly_name: 'Kitchen Temperature', unit_of_measurement: '°C' },
          },
          { entity_id: 'switch.garage', state: 'off', attributes: { friendly_name: 'Garage' } },
        ],
        callService: async () => null,
      },
    },
    'management',
  );
  try {
    const result = await app.inject({
      method: 'GET',
      url: '/api/manage/entities?q=KITCHEN&domain=sensor&limit=1',
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.json(), {
      entities: [
        {
          entityId: 'sensor.kitchen_temperature',
          name: 'Kitchen Temperature',
          domain: 'sensor',
          state: 'Available',
          available: true,
          unit: '°C',
          deviceClass: null,
          icon: null,
        },
      ],
      total: 1,
    });
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('the direct tablet listener never exposes the management entity catalogue', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-direct-entities-'));
  const app = await buildApp(
    {
      config: new ConfigRepository({ directory }),
      authorize: async () => true,
      homeAssistant: {
        getState: async () => ({}),
        getStates: async () => [],
        callService: async () => null,
      },
    },
    'direct',
  );
  try {
    assert.equal((await app.inject('/api/manage/entities')).statusCode, 403);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
