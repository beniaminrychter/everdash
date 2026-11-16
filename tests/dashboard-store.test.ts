import assert from 'node:assert/strict';
import test from 'node:test';
import { ObservationStore } from '@everdash/dashboard/features/dashboard/data/store';
import {
  describeStaleness,
  latestUpdate,
} from '@everdash/dashboard/features/dashboard/data/staleness';
import { defineConfig } from '@everdash/contracts/config';

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
import { HomeAssistantError } from '@everdash/dashboard/shared/home-assistant/client';
import type { CatalogApi } from '@everdash/dashboard/shared/home-assistant/client';

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

test('transport failures keep the last readings and the time of the last success', async () => {
  let offline = false;
  const { store } = setup({
    getState: async (id) => {
      if (offline) {
        throw new HomeAssistantError('Offline');
      }
      return id === power.entity_id ? power : temperature;
    },
  });
  await store.refresh();
  const succeededAt = store.getSnapshot().updatedAt;
  assert.notEqual(succeededAt, null);
  offline = true;
  await new Promise((resolve) => setTimeout(resolve, 5));
  await store.refresh();
  const snapshot = store.getSnapshot();
  assert.equal(snapshot.readings[temperature.entity_id]?.state, '21.5');
  assert.equal(snapshot.readings[power.entity_id]?.state, '13586');
  assert.match(snapshot.error!, /unavailable/i);
  assert.equal(snapshot.updatedAt, succeededAt);
  store.stop();
});

test('a failed catalog request keeps readings instead of blanking cards', async () => {
  let offline = false;
  const { store } = setup({
    getStates: async () => {
      if (offline) {
        throw new HomeAssistantError('Offline');
      }
      return [temperature, power];
    },
  });
  await store.refresh();
  offline = true;
  await store.refresh(true);
  assert.equal(store.getSnapshot().readings[temperature.entity_id]?.state, '21.5');
  assert.equal(store.getSnapshot().error, 'Offline');
  store.stop();
});

test('a missing entity affects only its own reading and raises no connection error', async () => {
  const { store } = setup({
    getState: async (id) => {
      if (id === power.entity_id) {
        throw new HomeAssistantError('Entity not found', 404);
      }
      return { ...temperature, state: '22.0' };
    },
  });
  await store.refresh();
  await store.refresh();
  const snapshot = store.getSnapshot();
  assert.equal(snapshot.error, null);
  assert.equal(snapshot.readings[power.entity_id], undefined);
  assert.equal(snapshot.readings[temperature.entity_id]?.state, '22.0');
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
  assert.deepEqual(store.getSnapshot().forecasts['weather.home#hourly'], forecast);
  now += 30_000;
  await store.refresh(false, false);
  assert.equal(calls, 1);
  fail = true;
  await store.refresh(true);
  assert.equal(calls, 2);
  assert.equal(store.getSnapshot().forecasts['weather.home#hourly'], undefined);
  assert.equal(store.getSnapshot().readings['weather.home']?.state, 'sunny');
  assert.equal(store.getSnapshot().error, null);
  fail = false;
  now += 900_000;
  await store.refresh(false, false);
  assert.equal(calls, 3);
  assert.deepEqual(store.getSnapshot().forecasts['weather.home#hourly'], forecast);
  weather.state = 'unavailable';
  await store.refresh(false, false);
  assert.equal(store.getSnapshot().forecasts['weather.home#hourly'], undefined);
  weather.state = 'sunny';
  await store.refresh(false, false);
  assert.equal(calls, 4);
  assert.deepEqual(store.getSnapshot().forecasts['weather.home#hourly'], forecast);
  failCatalog = true;
  await store.refresh(true);
  assert.deepEqual(store.getSnapshot().forecasts['weather.home#hourly'], forecast);
  failCatalog = false;
  await store.refresh(false, false);
  assert.equal(calls, 4);
  assert.deepEqual(store.getSnapshot().forecasts['weather.home#hourly'], forecast);
  weather.attributes.supported_features = 4;
  await store.refresh(true);
  assert.equal(calls, 4);
  assert.equal(store.getSnapshot().forecasts['weather.home#hourly'], undefined);
  store.stop();
});

function weatherSetup(
  cards: readonly Record<string, unknown>[],
  features: number | undefined,
  overrides: Partial<CatalogApi> = {},
) {
  const requests: [string, string][] = [];
  const weather = {
    attributes: {
      ...(features === undefined ? {} : { supported_features: features }),
      temperature: 14,
    },
    entity_id: 'weather.home',
    state: 'sunny',
  };
  const api: CatalogApi = {
    abort() {},
    callService: async () => {},
    getState: async () => weather,
    getStates: async () => [weather],
    getWeatherForecast: async (id, type) => {
      requests.push([id, type]);
      return {
        service_response: { [id]: { forecast: [{ datetime: `${type}`, temperature: 1 }] } },
      };
    },
    ...overrides,
  };
  const store = new ObservationStore(
    defineConfig({
      views: [{ cards: cards as never, id: 'home', title: 'Home' }],
    }),
    api,
  );

  return { requests, store, weather };
}

test('a daily weather card asks for the daily forecast and an hourly card also reads it for today', async () => {
  const { requests, store } = weatherSetup(
    [
      { type: 'weather', entity: 'weather.home', forecast: 'daily' },
      { type: 'weather', entity: 'weather.home' },
    ],
    3,
  );
  await store.refresh();
  assert.deepEqual(requests.sort(), [
    ['weather.home', 'daily'],
    ['weather.home', 'hourly'],
  ]);
  const forecasts = store.getSnapshot().forecasts;
  assert.deepEqual(Object.keys(forecasts).sort(), ['weather.home#daily', 'weather.home#hourly']);
  assert.deepEqual(forecasts['weather.home#daily'], [{ datetime: 'daily', temperature: 1 }]);
  assert.deepEqual(forecasts['weather.home#hourly'], [{ datetime: 'hourly', temperature: 1 }]);
  store.stop();
});

test('an hourly card reads the daily forecast only when its entity offers one', async () => {
  const hourlyOnly = weatherSetup([{ type: 'weather', entity: 'weather.home' }], 2);
  await hourlyOnly.store.refresh();
  assert.deepEqual(hourlyOnly.requests, [['weather.home', 'hourly']]);
  hourlyOnly.store.stop();
  const both = weatherSetup([{ type: 'weather', entity: 'weather.home' }], 3);
  await both.store.refresh();
  assert.deepEqual(both.requests.sort(), [
    ['weather.home', 'daily'],
    ['weather.home', 'hourly'],
  ]);
  both.store.stop();
});

test('an entity without the requested forecast type falls back to the other, or to none', async () => {
  const hourlyCard = weatherSetup([{ type: 'weather', entity: 'weather.home' }], 1);
  await hourlyCard.store.refresh();
  assert.deepEqual(hourlyCard.requests, [['weather.home', 'daily']]);
  assert.deepEqual(hourlyCard.store.getSnapshot().forecasts['weather.home#hourly'], [
    { datetime: 'daily', temperature: 1 },
  ]);
  hourlyCard.store.stop();
  const dailyCard = weatherSetup(
    [{ type: 'weather', entity: 'weather.home', forecast: 'daily' }],
    2,
  );
  await dailyCard.store.refresh();
  assert.deepEqual(dailyCard.requests, [['weather.home', 'hourly']]);
  assert.deepEqual(dailyCard.store.getSnapshot().forecasts['weather.home#daily'], [
    { datetime: 'hourly', temperature: 1 },
  ]);
  dailyCard.store.stop();
  const neither = weatherSetup([{ type: 'weather', entity: 'weather.home' }], 4);
  await neither.store.refresh();
  assert.deepEqual(neither.requests, []);
  assert.deepEqual(neither.store.getSnapshot().forecasts, {});
  neither.store.stop();
  const unreported = weatherSetup([{ type: 'weather', entity: 'weather.home' }], undefined);
  await unreported.store.refresh();
  // Without supported_features both types are tried; a failed daily read only drops today's range.
  assert.deepEqual(unreported.requests.sort(), [
    ['weather.home', 'daily'],
    ['weather.home', 'hourly'],
  ]);
  unreported.store.stop();
});

test('daily forecasts are cached for an hour while hourly ones refresh after 15 minutes', async (t) => {
  let now = Date.parse('2026-10-16T12:30:00Z');
  t.mock.method(Date, 'now', () => now);
  const { requests, store } = weatherSetup(
    [
      { type: 'weather', entity: 'weather.home' },
      { type: 'weather', entity: 'weather.home', forecast: 'daily' },
    ],
    3,
  );
  await store.refresh();
  assert.equal(requests.length, 2);
  now += 600_000;
  await store.refresh(false, false);
  assert.equal(requests.length, 2);
  now += 400_000;
  await store.refresh(false, false);
  assert.deepEqual(requests.slice(2), [['weather.home', 'hourly']]);
  now += 900_000;
  await store.refresh(false, false);
  assert.deepEqual(requests.slice(3), [['weather.home', 'hourly']]);
  now += 1_800_000;
  await store.refresh(false, false);
  assert.deepEqual(requests.slice(4).sort(), [
    ['weather.home', 'daily'],
    ['weather.home', 'hourly'],
  ]);
  store.stop();
});

test('forecasts of a card that changed its forecast type are dropped', async () => {
  const { store } = weatherSetup([{ type: 'weather', entity: 'weather.home' }], 3);
  await store.refresh();
  assert.deepEqual(Object.keys(store.getSnapshot().forecasts).sort(), [
    'weather.home#daily',
    'weather.home#hourly',
  ]);
  store.stop();
  const daily = weatherSetup([{ type: 'weather', entity: 'weather.home', forecast: 'daily' }], 3);
  await daily.store.refresh();
  assert.deepEqual(Object.keys(daily.store.getSnapshot().forecasts), ['weather.home#daily']);
  daily.store.stop();
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

test('staleness describes the age of the last successful reading', () => {
  assert.equal(describeStaleness(null, 1000), null);
  assert.equal(describeStaleness(0, 30_000)?.key, 'Updated less than a minute ago');
  assert.deepEqual(describeStaleness(0, 5 * 60_000), {
    key: 'Updated {minutes} min ago',
    values: { minutes: 5 },
  });
  assert.deepEqual(describeStaleness(0, 3 * 3_600_000), {
    key: 'Updated {hours} h ago',
    values: { hours: 3 },
  });
  assert.equal(latestUpdate([null, 5, 9, 2]), 9);
  assert.equal(latestUpdate([null]), null);
});

test('a malformed state response is a transport failure, not a missing entity', async () => {
  const { store } = setup({
    getState: async () => '<html>Bad gateway</html>',
  });
  await store.refresh();
  await store.refresh();
  assert.match(store.getSnapshot().error!, /unavailable/i);
  assert.equal(store.getSnapshot().readings[temperature.entity_id]?.state, '21.5');
  store.stop();
});

test('forecasts kept through a catalog failure expire with the 15 minute cache window', async (t) => {
  let now = Date.parse('2026-10-16T12:30:00Z');
  t.mock.method(Date, 'now', () => now);
  let offline = false;
  const weather = {
    attributes: { supported_features: 2, temperature: 14 },
    entity_id: 'weather.home',
    state: 'sunny',
  };
  const forecast = [{ datetime: '2026-10-16T13:00:00Z', temperature: 15 }];
  const store = new ObservationStore(
    defineConfig({
      views: [{ cards: [{ type: 'weather', entity: 'weather.home' }], id: 'home', title: 'Home' }],
    }),
    {
      abort() {},
      callService: async () => {},
      getState: async () => weather,
      getStates: async () => {
        if (offline) {
          throw new HomeAssistantError('Offline');
        }
        return [weather];
      },
      getWeatherForecast: async () => ({ service_response: { 'weather.home': { forecast } } }),
    },
  );
  await store.refresh();
  offline = true;
  now += 600_000;
  await store.refresh(true);
  assert.deepEqual(store.getSnapshot().forecasts['weather.home#hourly'], forecast);
  now += 400_000;
  await store.refresh(true);
  assert.equal(store.getSnapshot().forecasts['weather.home#hourly'], undefined);
  assert.equal(store.getSnapshot().readings['weather.home']?.state, 'sunny');
  store.stop();
});
