import assert from 'node:assert/strict';
import test from 'node:test';
import { defineConfig } from '@everdash/contracts/config';
import { HomeAssistantStore } from '@everdash/dashboard/features/accessories/data/store';
import { createDevice, deviceAccent } from '@everdash/dashboard/features/accessories/data/model';
import type { PageConfig } from '@everdash/dashboard/features/accessories/data/model';
import { defaultAccent } from '@everdash/dashboard/shared/color/tint';
import { isWidget, resolveDashboard } from '@everdash/dashboard/features/dashboard/data/discovery';
import { readValue, valueIcon } from '@everdash/dashboard/features/values/data/reading';
import { sceneUnavailable } from '@everdash/dashboard/features/scenes/data/availability';
import { staleSince } from '@everdash/dashboard/features/dashboard/data/staleness';
import {
  controlStatus,
  sensorStatus,
  toggleIcon,
} from '@everdash/dashboard/features/toggles/data/status';
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

test('discovery draws tile, compact, toggle and scene cards as accessories and hero values as widgets', () => {
  const { views } = resolveDashboard(config, []);
  assert.deepEqual(
    views[0].cards.map((card) => [isWidget(card) ? 'widget' : 'accessory', card.entity]),
    [
      ['accessory', 'sensor.power'],
      ['accessory', 'sensor.temp'],
      ['widget', 'sensor.total'],
      ['accessory', 'input_boolean.guest'],
      ['accessory', 'switch.pump'],
      ['accessory', 'binary_sensor.door'],
      ['accessory', 'scene.evening'],
      ['accessory', 'script.goodnight'],
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

test('value icons follow the device class only when no icon is chosen', () => {
  assert.equal(
    valueIcon(undefined, entity('sensor.t', '1', { device_class: 'temperature' })),
    'thermometer',
  );
  assert.equal(
    valueIcon(undefined, entity('sensor.h', '1', { device_class: 'humidity' })),
    'droplet',
  );
  assert.equal(valueIcon(undefined, entity('sensor.p', '1', { device_class: 'power' })), 'bolt');
  assert.equal(
    valueIcon(undefined, entity('sensor.b', '1', { device_class: 'battery' })),
    'battery',
  );
  assert.equal(
    valueIcon(undefined, entity('sensor.d', '1', { device_class: 'pressure' })),
    'gauge',
  );
  assert.equal(valueIcon(undefined, undefined), 'gauge');
  // An explicit choice, including the gauge itself, is never overridden.
  assert.equal(
    valueIcon('gauge', entity('sensor.t', '1', { device_class: 'temperature' })),
    'gauge',
  );
  assert.equal(valueIcon('moon', entity('sensor.t', '1', { device_class: 'temperature' })), 'moon');
});

const sensor = (kind: string) => entity('binary_sensor.x', 'on', { device_class: kind });

test('toggle icons follow a binary sensor device class unless chosen', () => {
  assert.equal(toggleIcon(undefined, sensor('door')), 'door');
  assert.equal(toggleIcon(undefined, sensor('window')), 'window');
  assert.equal(toggleIcon(undefined, sensor('garage_door')), 'garage');
  assert.equal(toggleIcon(undefined, sensor('motion')), 'motion');
  assert.equal(toggleIcon(undefined, sensor('occupancy')), 'away');
  assert.equal(toggleIcon(undefined, sensor('battery')), 'battery');
  assert.equal(toggleIcon(undefined, sensor('vibration')), 'toggle');
  assert.equal(toggleIcon(undefined, undefined), 'toggle');
  assert.equal(toggleIcon('moon', sensor('door')), 'moon');
});

test('a never-activated scene (state unknown) stays runnable; only missing or unavailable is a problem', () => {
  assert.equal(sceneUnavailable(entity('scene.evening', 'unknown'), true), false);
  assert.equal(sceneUnavailable(entity('script.go', 'off'), true), false);
  assert.equal(sceneUnavailable(entity('scene.evening', 'unavailable'), true), true);
  assert.equal(sceneUnavailable(entity('scene.evening', 'Unavailable'), true), true);
  assert.equal(sceneUnavailable(undefined, true), true);
  assert.equal(sceneUnavailable(undefined, false), false);
});

test('staleness reports the oldest success among the stores in error', () => {
  const stores = [
    { error: null, updatedAt: 900 },
    { error: 'Some readings are unavailable.', updatedAt: 100 },
    { error: 'Offline', updatedAt: 300 },
  ];
  assert.equal(staleSince(stores), 100);
  // A failing store that never succeeded is ignored, and with no failure the newest success wins.
  assert.equal(
    staleSince([
      { error: 'x', updatedAt: null },
      { error: null, updatedAt: 50 },
    ]),
    50,
  );
  assert.equal(
    staleSince([
      { error: null, updatedAt: 5 },
      { error: null, updatedAt: 9 },
    ]),
    9,
  );
  assert.equal(staleSince([]), null);
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

test('a failed input_boolean command rolls the card back and reports the failure', async () => {
  const calls: ServiceCommand[] = [];
  const api: HomeAssistantApi = {
    abort() {},
    callService: async (command) => {
      calls.push(command);
      throw new HomeAssistantError('Server error', 500);
    },
    getState: async (id) => entity(id, 'off'),
  };
  const store = new HomeAssistantStore(togglePage, api);
  await store.refresh();
  store.update('input_boolean.guest', { on: true });
  assert.equal(store.getSnapshot().devices[0].on, true);
  assert.equal(store.getSnapshot().devices[0].pending, true);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const device = store.getSnapshot().devices[0];
  assert.equal(calls.length, 1);
  assert.equal(device.on, false);
  assert.equal(device.pending, false);
  assert.equal(device.availability, 'available');
  assert.equal(store.getSnapshot().actionFailure?.entityId, 'input_boolean.guest');
  store.stop();
});

test('toggle devices use the default accent instead of blue', () => {
  for (const card of togglePage.cards) {
    const device = createDevice(card);
    assert.equal(device.color, defaultAccent);
    assert.notEqual(device.color, '#3498eb');
    assert.equal(deviceAccent(device), defaultAccent);
  }
});
