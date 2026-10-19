import test from 'node:test';
import assert from 'node:assert/strict';
import { createDevices } from '../src/features/legacy-home/data/data.ts';
import { homeReducer } from '../src/home/reducer.ts';
import type { HomeState } from '../src/home/reducer.ts';

function initial(): HomeState {
  return { activeScene: null, devices: createDevices() };
}

test('a power action updates its device without changing the previous snapshot', () => {
  const before = initial();
  const snapshot = JSON.stringify(before);
  const after = homeReducer(before, { id: 'floor-lamp', type: 'toggle' });
  assert.equal(after.devices[0].on, false);
  assert.notEqual(after, before);
  assert.notEqual(after.devices, before.devices);
  assert.equal(JSON.stringify(before), snapshot);
});

test('a scene updates accessories together and manual control clears the selection', () => {
  const before = initial();
  const movie = homeReducer(before, { scene: 'movie', type: 'scene' });
  assert.equal(movie.activeScene, 'movie');
  assert.equal(movie.devices[0].brightness, 15);
  assert.equal(movie.devices[4].on, true);
  assert.equal(movie.devices[6].on, false);
  assert.equal(before.devices[0].brightness, 65);
  const manual = homeReducer(movie, { id: 'floor-lamp', type: 'brightness', value: 42 });
  assert.equal(manual.activeScene, null);
  assert.equal(manual.devices[0].brightness, 42);
  assert.equal(movie.devices[0].brightness, 15);
});

test('zero brightness and power restore work across separate reducer snapshots', () => {
  const dimmed = homeReducer(initial(), { id: 'floor-lamp', type: 'brightness', value: 37 });
  const off = homeReducer(dimmed, { id: 'floor-lamp', type: 'brightness', value: 0 });
  const on = homeReducer(off, { id: 'floor-lamp', type: 'toggle' });
  assert.equal(off.devices[0].on, false);
  assert.equal(off.devices[0].brightness, 0);
  assert.equal(on.devices[0].on, true);
  assert.equal(on.devices[0].brightness, 37);
});

test('color changes are validated and invalid device IDs are harmless', () => {
  const before = initial();
  const after = homeReducer(before, { id: 'sofa-light', type: 'color', value: '#12ab34' });
  assert.equal(after.devices[1].color, '#12ab34');
  assert.equal(before.devices[1].color, '#a17af5');
  assert.equal(homeReducer(before, { id: 'missing', type: 'toggle' }), before);
  assert.equal(homeReducer(before, { id: 'sofa-light', type: 'color', value: 'invalid' }), before);
});
