import assert from 'node:assert/strict';
import test from 'node:test';
import { ObservationStore } from '../src/features/dashboard/data/store';
import { defineConfig } from '../src/shared/config';

const config = defineConfig({
  views: [
    {
      badges: [{ type: 'temperature', entity: 'sensor.real_temp' }],
      cards: [
        { type: 'light', entity: 'light.ceiling' },
        { type: 'pstryk', entity: 'sensor.pstryk_multisensor_activepower_0' },
      ],
      id: 'home',
      title: 'Home',
    },
  ],
});
import { HomeAssistantError } from '../src/shared/home-assistant/client';
import type { CatalogApi } from '../src/shared/home-assistant/client';

const temperature = {
  attributes: { friendly_name: 'Czujnik Jadalnia Temperatura', unit_of_measurement: '°C' },
  entity_id: 'sensor.real_temp',
  state: '21.5',
};
const power = {
  attributes: {
    device_class: 'power',
    friendly_name: 'Pstryk Active power',
    unit_of_measurement: 'W',
  },
  entity_id: 'sensor.pstryk_multisensor_activepower_0',
  state: '13586',
};
function setup(overrides: Partial<CatalogApi> = {}) {
  const requests: string[] = [];
  const api: CatalogApi = {
    abort() {},
    callService: async () => {},
    getState: async (id) => {
      requests.push(id);
      if (id === power.entity_id) {
        return { ...power, state: '1200' };
      }
      if (id === temperature.entity_id) {
        return temperature;
      }
      throw new HomeAssistantError('Not found', 404);
    },
    getStates: async () => {
      requests.push('catalog');
      return [temperature, power];
    },
    getWeatherForecast: async () => undefined,
    ...overrides,
  };
  return { requests, store: new ObservationStore(config, api) };
}

test('observations discover once and poll only resolved read-only entity IDs', async () => {
  const { store, requests } = setup();
  await store.refresh();
  assert.equal(store.getSnapshot().readings[temperature.entity_id]?.state, '21.5');
  await store.refresh();
  assert.deepEqual(requests, ['catalog', temperature.entity_id, power.entity_id]);
  assert.equal(store.getSnapshot().readings[power.entity_id]?.state, '1200');
  store.stop();
});

test('failed sensor reads are invalidated while other data sources remain usable', async () => {
  const { store } = setup({
    getState: async () => {
      throw new HomeAssistantError('Offline');
    },
  });
  await store.refresh();
  await store.refresh();
  assert.equal(store.getSnapshot().readings[temperature.entity_id], undefined);
  assert.match(store.getSnapshot().error!, /unavailable/i);
  store.stop();
});

test('metadata refresh updates omitted display names without resetting shared command bindings', async () => {
  let name = 'Ceiling';
  const { store } = setup({
    getStates: async () => [
      temperature,
      power,
      { attributes: { friendly_name: name }, entity_id: 'light.ceiling', state: 'on' },
    ],
  });
  await store.refresh();
  const { cards } = store.getSnapshot().resolved;
  name = 'Renamed ceiling';
  await store.refresh(true);
  assert.equal(store.getSnapshot().resolved.cards, cards);
  assert.equal(store.getSnapshot().resolved.views[0].cards[0].name, 'Renamed ceiling');
  store.stop();
});

test('stopped and paused observations ignore late network responses', async () => {
  let release: ((value: unknown) => void) | undefined;
  const { store } = setup({
    getStates: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  const reading = store.refresh();
  store.setActive(false);
  release!([temperature]);
  await reading;
  assert.equal(store.getSnapshot().readings[temperature.entity_id], undefined);
  store.stop();
});

test('authentication failures clear readings and stop retries until manual refresh', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const { store } = setup({
    getStates: async () => {
      calls++;
      throw new HomeAssistantError('Token rejected', 401);
    },
  });
  store.start();
  await new Promise((resolve) => setImmediate(resolve));
  t.mock.timers.tick(60_000);
  assert.equal(calls, 1);
  assert.deepEqual(store.getSnapshot().readings, {});
  await store.refresh(true);
  assert.equal(calls, 2);
  store.stop();
});

test('hourly forecasts are cached for 15 minutes; manual refresh retries independently of current weather', async (t) => {
  let now = Date.parse('2026-10-16T12:30:00Z');
  t.mock.method(Date, 'now', () => now);
  let calls = 0;
  let fail = false;
  let failCatalog = false;
  const weather = {
    attributes: { supported_features: 2, temperature: 14 },
    entity_id: 'weather.home',
    state: 'sunny',
  };
  const forecast = [{ datetime: '2026-10-16T13:00:00Z', temperature: 15 }];
  const api = {
    abort() {},
    callService: async () => {},
    getState: async () => weather,
    getStates: async () => {
      if (failCatalog) {
        throw new Error('Offline');
      }
      return [weather];
    },
    getWeatherForecast: async () => {
      calls++;
      if (fail) {
        throw new Error('Forecast unavailable');
      }
      return { service_response: { 'weather.home': { forecast } } };
    },
  };
  const store = new ObservationStore(
    defineConfig({
      views: [{ cards: [{ type: 'weather', entity: 'weather.home' }], id: 'home', title: 'Home' }],
    }),
    api,
  );
  await store.refresh();
  assert.deepEqual(store.getSnapshot().forecasts['weather.home'], forecast);
  now += 30_000;
  await store.refresh(false, false);
  assert.equal(calls, 1);
  fail = true;
  await store.refresh(true);
  assert.equal(calls, 2);
  assert.equal(store.getSnapshot().forecasts['weather.home'], undefined);
  assert.equal(store.getSnapshot().readings['weather.home']?.state, 'sunny');
  assert.equal(store.getSnapshot().error, null);
  fail = false;
  now += 900_000;
  await store.refresh(false, false);
  assert.equal(calls, 3);
  assert.deepEqual(store.getSnapshot().forecasts['weather.home'], forecast);
  weather.state = 'unavailable';
  await store.refresh(false, false);
  assert.equal(store.getSnapshot().forecasts['weather.home'], undefined);
  weather.state = 'sunny';
  await store.refresh(false, false);
  assert.equal(calls, 4);
  assert.deepEqual(store.getSnapshot().forecasts['weather.home'], forecast);
  failCatalog = true;
  await store.refresh(true);
  assert.deepEqual(store.getSnapshot().forecasts, {});
  failCatalog = false;
  await store.refresh(false, false);
  assert.equal(calls, 5);
  assert.deepEqual(store.getSnapshot().forecasts['weather.home'], forecast);
  weather.attributes.supported_features = 1;
  await store.refresh(true);
  assert.equal(calls, 5);
  assert.equal(store.getSnapshot().forecasts['weather.home'], undefined);
  store.stop();
});

test('paused forecast requests cannot publish late data', async () => {
  let release: ((value: unknown) => void) | undefined;
  const store = new ObservationStore(
    defineConfig({
      views: [{ cards: [{ type: 'weather', entity: 'weather.home' }], id: 'home', title: 'Home' }],
    }),
    {
      abort() {},
      callService: async () => {},
      getState: async () => undefined,
      getStates: async () => [
        { entity_id: 'weather.home', state: 'sunny', attributes: { supported_features: 2 } },
      ],
      getWeatherForecast: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    },
  );
  const pending = store.refresh();
  await new Promise((resolve) => setImmediate(resolve));
  store.setActive(false);
  release!({ service_response: { 'weather.home': { forecast: [] } } });
  await pending;
  assert.deepEqual(store.getSnapshot().forecasts, {});
  store.stop();
});

test('manual refresh queued during a forecast read retains its force-refresh intent', async () => {
  let release: ((value: unknown) => void) | undefined;
  let calls = 0;
  const store = new ObservationStore(
    defineConfig({
      views: [{ cards: [{ type: 'weather', entity: 'weather.home' }], id: 'home', title: 'Home' }],
    }),
    {
      abort() {},
      callService: async () => {},
      getState: async () => undefined,
      getStates: async () => [
        { entity_id: 'weather.home', state: 'sunny', attributes: { supported_features: 2 } },
      ],
      getWeatherForecast: async () => {
        calls++;
        if (calls === 1) {
          return new Promise((resolve) => {
            release = resolve;
          });
        }
        return { service_response: { 'weather.home': { forecast: [] } } };
      },
    },
  );
  const pending = store.refresh();
  await new Promise((resolve) => setImmediate(resolve));
  await store.refresh(true);
  release!({ service_response: { 'weather.home': { forecast: [] } } });
  await pending;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 2);
  store.stop();
});
