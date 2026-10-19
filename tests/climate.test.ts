import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createClimate,
  mapClimate,
  climateCommand,
  stepTemperature,
} from '../src/features/climate/data/model';
import { ClimateStore } from '../src/features/climate/data/store';
import type { ClimateCommand, ClimateApi } from '../src/shared/home-assistant/contracts';

const binding = {
  entityId: 'climate.ac' as const,
  name: 'Air Conditioner',
  temperatureUnit: '°C' as const,
};
const state = (temperature: unknown = 22, attributes = {}) => ({
  attributes: {
    current_temperature: 24,
    fan_mode: 'auto',
    fan_modes: ['auto', 'low', 'middle_low', 'medium', 'middle_high', 'high'],
    hvac_modes: ['off', 'cool', 'heat', 'dry'],
    max_temp: 32,
    min_temp: 16,
    supported_features: 441,
    target_temp_step: 1,
    temperature,
    ...attributes,
  },
  entity_id: binding.entityId,
  state: 'heat',
});
function setup(overrides: Partial<ClimateApi> = {}) {
  const commands: ClimateCommand[] = [];
  const api: ClimateApi = {
    abort() {},
    callService: async (command) => {
      commands.push(command);
    },
    getState: async () => state(),
    ...overrides,
  };
  return { commands, store: new ClimateStore([binding], 5000, api) };
}
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('AC state uses real target, limits, step and capabilities without inventing a setpoint', () => {
  const current = mapClimate(createClimate(binding), state());
  assert.equal(current.temperature, 22);
  assert.equal(current.fanMode, 'auto');
  assert.equal(current.hvacMode, 'heat');
  assert.equal(stepTemperature(current, 1), 23);
  assert.equal(stepTemperature({ ...current, temperature: 32 }, 1), 32);
  assert.equal(stepTemperature({ ...current, temperature: 16 }, -1), 16);
  assert.equal(stepTemperature({ ...current, step: 0.5, temperature: 21.5 }, 1), 22);
  assert.equal(mapClimate(current, state(null)).temperature, null);
  assert.equal(
    mapClimate(current, { ...state(), state: 'unavailable' }).availability,
    'unavailable',
  );
  assert.throws(() => mapClimate(current, { ...state(), entity_id: 'climate.other' }), /entity/i);
});

test('AC commands target only their configured entity and reject unsupported values', () => {
  const current = mapClimate(createClimate(binding), state());
  assert.deepEqual(climateCommand(current, { temperature: 23 }), {
    data: { entity_id: 'climate.ac', temperature: 23 },
    domain: 'climate',
    service: 'set_temperature',
  });
  assert.deepEqual(climateCommand(current, { hvacMode: 'cool' }), {
    data: { entity_id: 'climate.ac', hvac_mode: 'cool' },
    domain: 'climate',
    service: 'set_hvac_mode',
  });
  assert.deepEqual(climateCommand(current, { fanMode: 'medium' }), {
    data: { entity_id: 'climate.ac', fan_mode: 'medium' },
    domain: 'climate',
    service: 'set_fan_mode',
  });
  assert.throws(() => climateCommand(current, { temperature: 33 }), /temperature/i);
  assert.throws(() => climateCommand(current, { temperature: Number.NaN }), /temperature/i);
  assert.throws(() => climateCommand(current, { fanMode: 'mid' }), /fan/i);
  assert.throws(
    () => climateCommand({ ...current, hvacModes: ['heat'] }, { hvacMode: 'dry' }),
    /mode/i,
  );
});

test('temperature changes are immediate, coalesced and acknowledged without a stale read', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { store, commands } = setup();
  await store.refresh();
  store.update('climate.ac', { temperature: 23 }, 250);
  store.update('climate.ac', { temperature: 24 }, 250);
  assert.equal(store.getSnapshot().climates[0].temperature, 24);
  assert.equal(commands.length, 0);
  t.mock.timers.tick(250);
  await settle();
  assert.equal(commands.length, 1);
  assert.equal(commands[0].data.temperature, 24);
  assert.equal(store.getSnapshot().climates[0].temperature, 24);
  store.stop();
});

test('failed AC action rolls back only its field while newer fields remain optimistic', async () => {
  let reject: ((error: Error) => void) | undefined;
  const commands: ClimateCommand[] = [];
  const { store } = setup({
    callService: (command) => {
      commands.push(command);
      return commands.length === 1
        ? new Promise((_, fail) => {
            reject = fail;
          })
        : Promise.resolve();
    },
  });
  await store.refresh();
  store.update('climate.ac', { temperature: 23 });
  store.update('climate.ac', { fanMode: 'high' });
  reject!(new Error('Network error'));
  await settle();
  assert.equal(store.getSnapshot().climates[0].temperature, 22);
  assert.equal(store.getSnapshot().climates[0].fanMode, 'high');
  assert.match(store.getSnapshot().actionFailure!.message, /Air Conditioner/);
  assert.equal(store.getSnapshot().climates[0].availability, 'available');
  assert.equal(commands[1].service, 'set_fan_mode');
  store.stop();
});

test('an older failed command cannot roll back newer input for the same field', async () => {
  let reject: ((error: Error) => void) | undefined;
  let count = 0;
  const { store } = setup({
    callService: () =>
      ++count === 1
        ? new Promise((_, fail) => {
            reject = fail;
          })
        : Promise.resolve(),
  });
  await store.refresh();
  store.update('climate.ac', { temperature: 23 });
  store.update('climate.ac', { temperature: 24 });
  reject!(new Error('Network error'));
  await settle();
  assert.equal(store.getSnapshot().climates[0].temperature, 24);
  assert.equal(count, 2);
  store.stop();
});

test('failed later command returns to the previously accepted setpoint', async () => {
  let count = 0;
  const { store } = setup({
    callService: async () => {
      if (++count === 2) {
        throw new Error('Failed');
      }
    },
  });
  await store.refresh();
  store.update('climate.ac', { temperature: 23 });
  await settle();
  store.update('climate.ac', { temperature: 24 });
  await settle();
  assert.equal(store.getSnapshot().climates[0].temperature, 23);
  store.stop();
});

test('stale polls and commands after a pause cannot overwrite newer AC state', async () => {
  let release: ((value: unknown) => void) | undefined;
  const { store } = setup();
  await store.refresh();
  store.update('climate.ac', { temperature: 23 });
  await settle();
  store.setActive(false);
  store.update('climate.ac', { temperature: 25 });
  assert.equal(store.getSnapshot().climates[0].temperature, 23);
  store.stop();
  const late = setup({
    getState: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  const poll = late.store.refresh();
  late.store.setActive(false);
  release!(state(28));
  await poll;
  assert.equal(late.store.getSnapshot().climates[0].temperature, null);
  late.store.stop();
});

test('an old AC poll cannot overwrite a newer accepted command', async () => {
  let release: ((value: unknown) => void) | undefined;
  let reads = 0;
  const { store } = setup({
    getState: () =>
      ++reads === 1
        ? Promise.resolve(state())
        : new Promise((resolve) => {
            release = resolve;
          }),
  });
  await store.refresh();
  const oldPoll = store.refresh();
  store.update('climate.ac', { temperature: 23 });
  await settle();
  release!(state(22));
  await oldPoll;
  assert.equal(store.getSnapshot().climates[0].temperature, 23);
  store.stop();
});

test('a command acknowledged after a pause cannot restore discarded optimistic state', async () => {
  let release: (() => void) | undefined;
  const { store } = setup({
    callService: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  await store.refresh();
  store.update('climate.ac', { temperature: 25 });
  assert.equal(store.getSnapshot().climates[0].temperature, 25);
  store.setActive(false);
  assert.equal(store.getSnapshot().climates[0].temperature, 22);
  release!();
  await settle();
  assert.equal(store.getSnapshot().climates[0].temperature, 22);
  store.stop();
});
