import assert from 'node:assert/strict';
import test from 'node:test';
import { defineConfig } from '@everdash/contracts/config';
import { HomeAssistantStore } from '@everdash/dashboard/features/accessories/data/store';
import type { PageConfig } from '@everdash/dashboard/features/accessories/data/model';
import {
  groupCards,
  resolveDashboard,
} from '@everdash/dashboard/features/dashboard/data/discovery';
import { readValue, valueIcon } from '@everdash/dashboard/features/values/data/reading';
import { controlStatus, sensorStatus } from '@everdash/dashboard/features/toggles/data/status';
import type { HomeAssistantApi } from '@everdash/dashboard/shared/home-assistant/client';
import type { ServiceCommand } from '@everdash/contracts/home-assistant/contracts';

const config = defineConfig({
  views: [
    {
      cards: [
        { type: 'value', entity: 'sensor.power', template: 'tile' },
        { type: 'value', entity: 'sensor.temp', template: 'compact' },
        { type: 'value', entity: 'sensor.total', template: 'hero' },
        { type: 'toggle', entity: 'input_boolean.guest' },
        { type: 'toggle', entity: 'switch.pump' },
        { type: 'toggle', entity: 'binary_sensor.door' },
        { type: 'scene', entity: 'scene.evening' },
        { type: 'scene', entity: 'script.goodnight' },
      ],
      id: 'home',
      title: 'Home',
    },
  ],
});
const entity = (id: string, state: string, attributes: Record<string, unknown> = {}) => ({
  attributes,
  entity_id: id,
  state,
});

test('discovery groups tile, compact, toggle and scene cards as accessories and hero values as widgets', () => {
  const { views } = resolveDashboard(config, []);
  const groups = groupCards(views[0].cards);
  assert.deepEqual(
    groups.map((group) => [group.type, group.cards.map((card) => card.entity)]),
    [
      ['accessories', ['sensor.power', 'sensor.temp']],
      ['widgets', ['sensor.total']],
      [
        'accessories',
        [
          'input_boolean.guest',
          'switch.pump',
          'binary_sensor.door',
          'scene.evening',
          'script.goodnight',
        ],
      ],
    ],
  );
});

test('discovery commands only switch and input_boolean toggles and observes everything else', () => {
  const resolved = resolveDashboard(config, []);
  assert.deepEqual(
    resolved.cards.map((card) => [card.type, card.entityId]),
    [
      ['toggle', 'input_boolean.guest'],
      ['toggle', 'switch.pump'],
    ],
  );
  assert.deepEqual(resolved.observationIds, [
    'sensor.power',
    'sensor.temp',
    'sensor.total',
    'binary_sensor.door',
    'scene.evening',
    'script.goodnight',
  ]);
});

test('value readings apply precision and unit overrides and report unavailable states', () => {
  const ready = { online: true, ready: true };
  const power = entity('sensor.power', '1234.5678', { unit_of_measurement: 'W' });
  assert.deepEqual(readValue(power, {}, ready, 'en-GB'), {
    status: 'ready',
    unit: 'W',
    value: '1,234.57',
  });
  assert.deepEqual(readValue(power, { precision: 0, unit: 'watts' }, ready, 'en-GB'), {
    status: 'ready',
    unit: 'watts',
    value: '1,235',
  });
  assert.equal(readValue(power, { precision: 3 }, ready, 'en-GB').value, '1,234.568');
  assert.equal(readValue(power, { unit: '' }, ready, 'en-GB').unit, '');
  assert.equal(
    readValue(entity('sensor.mode', 'eco'), { precision: 2 }, ready, 'en-GB').value,
    'eco',
  );
  assert.equal(
    readValue(entity('sensor.x', 'unavailable'), {}, ready, 'en-GB').status,
    'unavailable',
  );
  assert.equal(readValue(undefined, {}, ready, 'en-GB').status, 'unavailable');
  assert.equal(readValue(undefined, {}, { online: true, ready: false }, 'en-GB').status, 'loading');
  assert.equal(readValue(power, {}, { online: false, ready: true }, 'en-GB').status, 'offline');
});

test('generic value icons follow the device class while explicit icons are kept', () => {
  assert.equal(
    valueIcon('gauge', entity('sensor.t', '1', { device_class: 'temperature' })),
    'thermometer',
  );
  assert.equal(
    valueIcon('gauge', entity('sensor.h', '1', { device_class: 'humidity' })),
    'droplet',
  );
  assert.equal(valueIcon('gauge', entity('sensor.p', '1', { device_class: 'power' })), 'gauge');
  assert.equal(valueIcon('moon', entity('sensor.t', '1', { device_class: 'temperature' })), 'moon');
  assert.equal(valueIcon('gauge', undefined), 'gauge');
});

test('binary sensor toggles use device-class labels and never look like controls', () => {
  const ready = { online: true, ready: true };
  assert.deepEqual(
    sensorStatus(entity('binary_sensor.door', 'on', { device_class: 'door' }), ready, 'en-GB'),
    { on: true, problem: false, text: 'Open' },
  );
  assert.equal(
    sensorStatus(entity('binary_sensor.m', 'off', { device_class: 'motion' }), ready, 'en-GB').text,
    'Clear',
  );
  assert.equal(sensorStatus(undefined, ready, 'en-GB').problem, true);
  assert.equal(
    controlStatus({
      availability: 'unavailable',
      brightness: 0,
      color: '#fff',
      colorCapable: false,
      dimmable: false,
      icon: 'toggle',
      id: 'input_boolean.guest',
      lastBrightness: 100,
      name: 'Guest',
      on: false,
      pending: false,
      room: 'Home',
      type: 'toggle',
    }).text,
    'Unavailable',
  );
});

const togglePage: PageConfig = {
  cards: [
    {
      entityId: 'input_boolean.guest',
      icon: 'toggle',
      name: 'Guest',
      room: 'Home',
      type: 'toggle',
    },
    { entityId: 'switch.pump', icon: 'toggle', name: 'Pump', room: 'Home', type: 'toggle' },
  ],
  pollIntervalMs: 5000,
};

function setup() {
  const calls: ServiceCommand[] = [];
  const api: HomeAssistantApi = {
    abort() {},
    callService: async (command) => {
      calls.push(command);
    },
    getState: async (id) => entity(id, 'off'),
  };

  return { calls, store: new HomeAssistantStore(togglePage, api) };
}

test('toggle controls send input_boolean and switch commands through the shared store', async () => {
  const { calls, store } = setup();
  await store.refresh();
  store.update('input_boolean.guest', { on: true });
  store.update('switch.pump', { on: true });
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(calls, [
    { data: { entity_id: 'input_boolean.guest' }, domain: 'input_boolean', service: 'turn_on' },
    { data: { entity_id: 'switch.pump' }, domain: 'switch', service: 'turn_on' },
  ]);
  assert.equal(store.getSnapshot().devices[0].on, true);
  store.stop();
});

test('scenes and scripts run with only an entity_id; other entities are refused', async () => {
  const { calls, store } = setup();
  await store.activate('scene.evening');
  await store.activate('script.goodnight');
  assert.deepEqual(calls, [
    { data: { entity_id: 'scene.evening' }, domain: 'scene', service: 'turn_on' },
    { data: { entity_id: 'script.goodnight' }, domain: 'script', service: 'turn_on' },
  ]);
  await assert.rejects(() => store.activate('light.kitchen'));
  await assert.rejects(() => store.activate('scene.evening; drop'));
  store.stop();
  await assert.rejects(() => store.activate('scene.evening'));
});
