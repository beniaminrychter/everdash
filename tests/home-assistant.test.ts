import assert from 'node:assert/strict';
import test from 'node:test';
import { createCommand, createDevice, mapState } from '../src/features/accessories/data/model';
import { homePage } from './fixtures/home';

const light = homePage.cards[0];
const outlet = homePage.cards[1];

test('control fixtures retain the original light and outlet bindings', () => {
  assert.deepEqual(
    homePage.cards.map((card) => [card.type, card.entityId]),
    [
      ['light', 'light.salon_dodatkowe'],
      ['outlet', 'switch.ogrod_taras_kinkiety'],
    ],
  );
});

test('entities start loading rather than displaying fixture state', () => {
  const device = createDevice(light);
  assert.equal(device.id, light.entityId);
  assert.equal(device.availability, 'loading');
  assert.equal(device.on, false);
  assert.equal(device.dimmable, false);
});

test('Home Assistant brightness and RGB state map to the light card', () => {
  const device = mapState(createDevice(light), {
    attributes: {
      brightness: 204,
      rgb_color: [255, 124, 121],
      supported_color_modes: ['rgb'],
    },
    entity_id: light.entityId,
    state: 'on',
  });
  assert.equal(device.on, true);
  assert.equal(device.brightness, 80);
  assert.equal(device.availability, 'available');
  assert.equal(device.dimmable, true);
  assert.equal(device.colorCapable, true);
  assert.equal(device.color, '#ff7c79');
});

test('off lights retain remembered brightness, but unknown states disable control', () => {
  const on = mapState(createDevice(light), {
    attributes: { brightness: 102, supported_color_modes: ['brightness'] },
    entity_id: light.entityId,
    state: 'on',
  });
  const off = mapState(on, {
    attributes: { brightness: null, supported_color_modes: ['brightness'] },
    entity_id: light.entityId,
    state: 'off',
  });
  assert.equal(off.lastBrightness, 40);
  assert.equal(off.on, false);
  assert.equal(
    mapState(off, { attributes: {}, entity_id: light.entityId, state: 'unknown' }).availability,
    'unavailable',
  );
  assert.equal(
    mapState(off, { attributes: {}, entity_id: light.entityId, state: 'unavailable' }).availability,
    'unavailable',
  );
});

test('on/off-only lights and switches never gain unsupported controls', () => {
  for (const card of [light, outlet]) {
    const device = mapState(createDevice(card), {
      attributes: { supported_color_modes: ['onoff'] },
      entity_id: card.entityId,
      state: 'off',
    });
    assert.equal(device.dimmable, false);
    assert.equal(device.colorCapable, false);
  }
});

test('invalid entity responses are rejected rather than controlling a different entity', () => {
  assert.throws(
    () =>
      mapState(createDevice(light), { attributes: {}, entity_id: outlet.entityId, state: 'on' }),
    /Invalid/,
  );
  assert.throws(() => mapState(createDevice(light), null), /Invalid/);
});

test('commands call real domain services with only the configured entity', () => {
  assert.deepEqual(createCommand(outlet, { on: true }), {
    data: { entity_id: outlet.entityId },
    domain: 'switch',
    service: 'turn_on',
  });
  assert.deepEqual(createCommand(light, { brightness: 0 }), {
    data: { entity_id: light.entityId },
    domain: 'light',
    service: 'turn_off',
  });
  assert.deepEqual(createCommand(light, { brightness: 42.4, color: '#ff7c79' }), {
    data: { brightness_pct: 42, entity_id: light.entityId, rgb_color: [255, 124, 121] },
    domain: 'light',
    service: 'turn_on',
  });
  assert.throws(() => createCommand(outlet, { brightness: 50 }), /light/);
  assert.throws(() => createCommand(light, { brightness: Number.NaN }), /brightness/);
  assert.throws(() => createCommand(light, { color: 'red' }), /color/);
});
