import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildApp } from '../apps/server/src/app';
import { ConfigRepository } from '../apps/server/src/config/repository';

test('management entity search is bounded, domain filtered and returns builder metadata only', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-entities-'));
  const app = await buildApp({
    config: new ConfigRepository({ directory }),
    access: { isAdmin: () => true, isTablet: () => true },
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
  });
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

test('management entity search accepts a short list of comma-separated domains', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-entity-domains-'));
  const app = await buildApp({
    config: new ConfigRepository({ directory }),
    access: { isAdmin: () => true, isTablet: () => true },
    homeAssistant: {
      getState: async () => ({}),
      getStates: async () => [
        { entity_id: 'sensor.power', state: '1', attributes: {} },
        { entity_id: 'input_number.target', state: '2', attributes: {} },
        { entity_id: 'light.kitchen', state: 'on', attributes: {} },
      ],
      callService: async () => null,
    },
  });
  try {
    const result = await app.inject('/api/manage/entities?domain=sensor,input_number');
    assert.equal(result.statusCode, 200);
    assert.deepEqual(
      result.json().entities.map((entity: { entityId: string }) => entity.entityId),
      ['input_number.target', 'sensor.power'],
    );
    const invalid = await app.inject('/api/manage/entities?domain=sensor,,light');
    assert.equal(invalid.statusCode, 400);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('the direct tablet listener never exposes the management entity catalogue', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-direct-entities-'));
  const app = await buildApp({
    config: new ConfigRepository({ directory }),
    access: { isAdmin: () => false, isTablet: () => true },
    homeAssistant: {
      getState: async () => ({}),
      getStates: async () => [],
      callService: async () => null,
    },
  });
  try {
    assert.equal((await app.inject('/api/manage/entities')).statusCode, 401);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
