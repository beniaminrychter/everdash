import test from 'node:test';
import assert from 'node:assert/strict';
import { createDevices } from '../src/features/legacy-home/data/data.ts';
import {
  toggleDevice,
  setBrightness,
  setColor,
  applyScene,
  restoreDevices,
} from '../src/features/legacy-home/data/state.ts';
import { loadDevices, saveDevices } from '../src/features/legacy-home/data/storage.ts';

test('power cycling restores a dimmed light after brightness reaches zero', () => {
  const light = createDevices()[0];
  setBrightness(light, 37);
  setBrightness(light, 0);
  assert.equal(light.on, false);
  toggleDevice(light);
  assert.equal(light.on, true);
  assert.equal(light.brightness, 37);
});

test('brightness is clamped and outlets ignore dimming and colors', () => {
  const devices = createDevices();
  setBrightness(devices[0], 900);
  assert.equal(devices[0].brightness, 100);
  setBrightness(devices[0], -50);
  assert.equal(devices[0].on, false);
  const outlet = devices[4];
  const before = JSON.stringify(outlet);
  setBrightness(outlet, 55);
  setColor(outlet, '#ff0000');
  assert.equal(JSON.stringify(outlet), before);
});

test('only color-capable bulbs accept valid hex colors', () => {
  const devices = createDevices();
  setColor(devices[1], '#12aB34');
  assert.equal(devices[1].color, '#12ab34');
  setColor(devices[1], 'bad html');
  assert.equal(devices[1].color, '#12ab34');
  const original = devices[0].color;
  setColor(devices[0], '#ff0000');
  assert.equal(devices[0].color, original);
});

test('away turns everything off; movie time sets dim lights and TV', () => {
  const devices = createDevices();
  applyScene(devices, 'away');
  assert.ok(devices.every((device) => !device.on));
  applyScene(devices, 'movie');
  assert.equal(devices[0].brightness, 15);
  assert.equal(devices[1].brightness, 20);
  assert.equal(devices[4].on, true);
  assert.equal(devices[3].on, false);
});

test('saved data cannot overwrite definitions or inject invalid values', () => {
  const devices = restoreDevices(
    JSON.stringify([
      {
        brightness: 999,
        color: 'red',
        id: 'floor-lamp',
        name: '<script>',
        on: true,
        type: 'outlet',
      },
      { brightness: 42, color: '#abcdef', id: 'sofa-light', lastBrightness: 42, on: false },
      { id: 'not-a-real-device', on: true },
    ]),
  );
  assert.equal(devices.length, 8);
  assert.equal(devices[0].name, 'Floor lamp');
  assert.equal(devices[0].type, 'light');
  assert.equal(devices[0].brightness, 65);
  assert.equal(devices[1].brightness, 42);
  assert.equal(devices[1].on, false);
  assert.equal(devices[1].color, '#abcdef');
});

test('corrupt saved state falls back to usable independent fixtures', () => {
  for (const value of [null, '', '{broken', '{}', 'null', '[null,42,"hi"]']) {
    assert.equal(restoreDevices(value).length, 8);
  }
  const first = createDevices();
  first[0].on = false;
  assert.equal(createDevices()[0].on, true);
});

test('fractional corrupt saved percentages cannot create an on light at zero brightness', () => {
  const light = restoreDevices(
    '[{"id":"floor-lamp","on":true,"brightness":0,"lastBrightness":0.1}]',
  )[0];
  assert.ok(light.brightness > 0);
});

test('unavailable browser storage still allows booting and changing devices', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Storage denied');
    },
  });
  try {
    const devices = loadDevices();
    assert.equal(devices.length, 8);
    toggleDevice(devices[0]);
    assert.equal(devices[0].on, false);
    assert.equal(saveDevices(devices), false);
  } finally {
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
