import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDashboard, parseEntities } from '../src/features/dashboard/data/discovery';
import { mapEnergy, powerKilowatts } from '../src/features/energy/data/readings';
import { mapWeather, parseForecastResponse } from '../src/features/weather/data/forecast';
import { sensorValue } from '../src/features/sensors/data/readings';
import config from './fixtures/dashboard';

const entity = (
  id: string,
  name: string,
  state = 'on',
  attributes: Record<string, unknown> = {},
) => ({ attributes: { friendly_name: name, ...attributes }, entity_id: id, state });
test('power readings normalize W and kW, preserve zero and export, and reject energy totals', () => {
  for (const [state, unit, expected] of [
    ['13586', 'W', 13.586],
    ['0.42', 'kW', 0.42],
    ['0', 'W', 0],
    ['-1200', 'W', -1.2],
    ['123', 'kWh', null],
    ['123', 'VA', null],
    ['123', 'var', null],
    ['123', '', null],
    ['unavailable', 'W', null],
    ['unknown', 'W', null],
    ['', 'W', null],
    ['invalid', 'W', null],
    ['Infinity', 'W', null],
  ] as const) {
    assert.equal(
      powerKilowatts(entity('sensor.power', 'Power', state, { unit_of_measurement: unit })),
      expected,
      `${state} ${unit}`,
    );
  }
  assert.equal(powerKilowatts(), null);
});

test('configured total power is polled without adding phase or appliance sensors', () => {
  const result = resolveDashboard(config, []);
  assert.ok(result.observationIds.includes('sensor.pstryk_multisensor_activepower_0'));
  assert.ok(!result.observationIds.includes('sensor.pstryk_multisensor_activepower_1'));
});

test('invalid catalog payloads are rejected instead of clearing every entity', () => {
  assert.throws(() => parseEntities({ message: 'not a list' }), /Invalid/);
  assert.equal(parseEntities([null, entity('sensor.valid', 'Valid', '0')]).length, 1);
});

test('sensor zero is valid while empty, non-numeric and unavailable readings never become zero', () => {
  assert.equal(sensorValue(entity('sensor.test', 'Test', '0')).value, '0');
  assert.equal(sensorValue(entity('sensor.test', 'Test', 'unavailable')).available, false);
  assert.equal(sensorValue().available, false);
  assert.equal(
    sensorValue(entity('binary_sensor.window', 'Window', 'on', { device_class: 'window' })).value,
    'Open',
  );
});

test('energy monitoring preserves negative/zero rates, normalizes MWh, and ignores stale schedule slots', () => {
  const now = Date.parse('2026-10-16T10:15:00+02:00');
  const buy = entity('sensor.buy', 'Pstryk Buy Price', '0', {
    prices_today: [
      { time: '2026-10-16T09:00:00+02:00', price: 0.7 },
      { time: '2026-10-16T10:00:00+02:00', price: 0 },
      { time: '2026-10-16T11:00:00+02:00', price: -0.1 },
      { time: 'invalid', price: 1 },
      { time: '2025-01-01T00:00:00Z', price: 0.2 },
    ],
    unit_of_measurement: 'PLN/kWh',
  });
  const result = mapEnergy(
    buy,
    entity('sensor.sell', 'Sell', '-50', { unit_of_measurement: 'PLN/MWh' }),
    undefined,
    now,
  );
  assert.equal(result.buy, 0);
  assert.equal(result.sell, -0.05);
  assert.equal(result.slots.length, 3);
  assert.equal(result.next, -0.1);
  assert.equal(result.cheapest?.price, -0.1);
  assert.equal(
    mapEnergy(
      entity('sensor.buy', 'Buy', 'unknown', { unit_of_measurement: 'PLN/kWh' }),
      undefined,
      undefined,
      now,
    ).buy,
    null,
  );
});

test('price schedules require explicit timezones and numeric prices; currencies are not mixed', () => {
  const now = Date.parse('2026-10-16T10:15:00+02:00');
  const buy = entity('sensor.buy', 'Buy', '1', {
    prices_today: [
      { time: '2026-10-16T11:00:00', price: 0.5 },
      { time: '2026-10-16T11:00:00+02:00', price: null },
    ],
    unit_of_measurement: 'PLN/kWh',
  });
  const result = mapEnergy(
    buy,
    entity('sensor.sell', 'Sell', '1', { unit_of_measurement: 'EUR/kWh' }),
    undefined,
    now,
  );
  assert.equal(result.slots.length, 0);
  assert.equal(result.sell, null);
});

test('weather uses supplied units and handles valid zero values and missing attributes', () => {
  const result = mapWeather(
    entity('weather.home', 'Home', 'rainy', {
      humidity: 0,
      temperature: 0,
      temperature_unit: '°C',
      wind_speed: 0,
      wind_speed_unit: 'km/h',
    }),
  );
  assert.equal(result.condition, 'Rainy');
  assert.equal(result.temperature, 0);
  assert.equal(result.humidity, 0);
  assert.equal(result.windSpeed, 0);
  assert.equal(mapWeather(entity('weather.home', 'Home', 'unavailable')).available, false);
  assert.equal(mapWeather(entity('weather.home', 'Home', 'sunny')).temperature, null);
});

test('legacy ha_Pstryk attributes use the configured home timezone and Next hour field', () => {
  const now = Date.parse('2026-10-16T06:15:00+02:00');
  const buy = entity('sensor.buy', 'Pstryk Current Buy Price', '1.78', {
    'All prices': [
      { start: '2026-10-16T06:00:00', price: 1.78 },
      { start: '2026-10-16T07:00:00', price: 1.92 },
      { start: '2026-10-16T13:00:00', price: 0.74 },
    ],
    'Is cheap': false,
    'Next hour': 1.92,
    unit_of_measurement: 'PLN/kWh',
  });
  const result = mapEnergy(buy, undefined, undefined, now, undefined, 'Europe/Warsaw');
  assert.equal(result.slots.length, 3);
  assert.equal(result.slots[0].time, Date.parse('2026-10-16T06:00:00+02:00'));
  assert.equal(result.next, 1.92);
  assert.equal(result.cheap, false);
  assert.equal(result.cheapest?.price, 0.74);
  assert.equal(mapEnergy(buy, undefined, undefined, now).slots.length, 0);
});

test('local schedule times reject DST gaps and ambiguous fallback times rather than guessing', () => {
  for (const time of ['2026-03-29T02:30:00', '2026-10-25T02:30:00']) {
    const now = Date.parse(`${time.slice(0, 10)}T00:00:00Z`);
    const buy = entity('sensor.buy', 'Buy', '1', {
      'All prices': [{ start: time, price: 1 }],
      unit_of_measurement: 'PLN/kWh',
    });
    assert.equal(
      mapEnergy(buy, undefined, undefined, now, undefined, 'Europe/Warsaw').slots.length,
      0,
    );
  }
  const now = Date.parse('2026-01-16T06:15:00+01:00');
  const buy = entity('sensor.buy', 'Buy', '1', {
    'All prices': [{ start: '2026-01-16T07:00:00', price: 1 }],
    unit_of_measurement: 'PLN/kWh',
  });
  assert.equal(
    mapEnergy(buy, undefined, undefined, now, undefined, 'Europe/Warsaw').slots[0].time,
    Date.parse('2026-01-16T07:00:00+01:00'),
  );
});

test('legacy Pstryk schedules and next-hour values share normalized MWh units', () => {
  const buy = entity('sensor.buy', 'Buy', '1000', {
    'All prices': [{ start: '2026-10-16T06:00:00', price: 1000 }],
    'Next hour': 2000,
    unit_of_measurement: 'PLN / MWh ',
  });
  const result = mapEnergy(
    buy,
    undefined,
    undefined,
    Date.parse('2026-10-16T06:15:00+02:00'),
    undefined,
    'Europe/Warsaw',
  );
  assert.equal(result.buy, 1);
  assert.equal(result.next, 2);
  assert.equal(result.slots[0].price, 1);
});

test('Pstryk price status respects integration flags and never implies cheap when unavailable', () => {
  const buy = entity('sensor.buy', 'Buy', '2', {
    'Is cheap': false,
    'Is expensive': true,
    unit_of_measurement: 'PLN/kWh',
  });
  assert.equal(mapEnergy(buy, undefined, undefined, Date.now()).status, 'expensive');
  buy.attributes['Is expensive'] = false;
  buy.attributes['Is cheap'] = true;
  assert.equal(mapEnergy(buy, undefined, undefined, Date.now()).status, 'cheap');
  buy.attributes['Is cheap'] = false;
  assert.equal(mapEnergy(buy, undefined, undefined, Date.now()).status, 'standard');
  buy.state = 'unavailable';
  buy.attributes['Is cheap'] = true;
  assert.equal(mapEnergy(buy, undefined, undefined, Date.now()).status, 'unknown');
});

test('configured sun is observed for automatic appearance', () => {
  const result = resolveDashboard(config, [entity('sun.sun', 'Sun', 'above_horizon')]);
  assert.equal(result.sun?.status, 'resolved');
  assert.ok(result.observationIds.includes('sun.sun'));
});

test('today’s price schedule takes precedence over integration flags', () => {
  const now = Date.parse('2026-10-16T06:15:00Z');
  const buy = entity('sensor.buy', 'Buy', '2', {
    is_cheap: false,
    prices: [
      { time: '2026-10-16T06:00:00Z', price: 2 },
      { time: '2026-10-16T07:00:00Z', price: 0.5 },
    ],
    unit_of_measurement: 'PLN/kWh',
  });
  assert.equal(mapEnergy(buy, undefined, undefined, now).status, 'expensive');
  buy.attributes.is_expensive = false;
  assert.equal(mapEnergy(buy, undefined, undefined, now).status, 'expensive');
});

test('temperature sensors always show one decimal without changing other sensor formats', () => {
  for (const [state, expected] of [
    ['21', '21.0'],
    ['21.46', '21.5'],
    ['0', '0.0'],
    ['-2', '-2.0'],
  ]) {
    assert.equal(
      sensorValue(entity('sensor.temp', 'Temp', state, { unit_of_measurement: '°C' })).value,
      expected,
    );
  }
  assert.equal(sensorValue(entity('sensor.power', 'Power', '1')).value, '1');
});

test('daily low and nearby prices are cheap even when Pstryk flags are false', () => {
  const now = Date.parse('2026-10-16T23:30:00+02:00');
  const buy = entity('sensor.buy', 'Buy', '-0.2', {
    'Is cheap': false,
    'Is expensive': false,
    prices: [
      { time: '2026-10-15T23:45:00+02:00', price: -2 },
      { time: '2026-10-16T01:00:00+02:00', price: -0.2 },
      { time: '2026-10-16T22:00:00+02:00', price: 0.8 },
      { time: '2026-10-17T00:00:00+02:00', price: -3 },
    ],
    unit_of_measurement: 'PLN/kWh',
  });
  const read = () => mapEnergy(buy, undefined, undefined, now, undefined, 'Europe/Warsaw');
  assert.equal(read().todayMinimum, -0.2);
  assert.equal(read().status, 'cheap');
  assert.equal(read().atDailyLow, true);
  buy.state = '-0.1';
  assert.equal(read().status, 'cheap');
  assert.equal(read().atDailyLow, false);
  buy.state = '-0.09';
  assert.equal(read().status, 'standard');
  buy.state = 'unavailable';
  assert.equal(read().status, 'unknown');
});

test('hourly weather validates, sorts and keeps only the next five hours without inventing data', () => {
  const now = Date.parse('2026-10-16T12:30:00Z');
  const raw = [
    { condition: 'rainy', datetime: '2026-10-16T14:00:00Z', temperature: 0 },
    { condition: 'sunny', datetime: '2026-10-16T13:00:00Z', temperature: -1 },
    { datetime: '2026-10-16T13:00:00Z', temperature: 99 },
    { datetime: '2026-10-16T12:00:00Z', temperature: 2 },
    { datetime: '2026-10-16T18:00:00Z', temperature: 3 },
    { datetime: '2026-10-16T15:00:00Z', temperature: null },
    { datetime: 'invalid', temperature: 4 },
  ];
  const result = mapWeather(entity('weather.home', 'Home', 'sunny'), raw, now);
  assert.deepEqual(
    result.forecast.map((item) => item.temperature),
    [-1, 0],
  );
  assert.equal(result.forecast[1].condition, 'Rainy');
  assert.equal(mapWeather(undefined, raw, now).available, false);
});

test('the daily minimum includes the start of a 25-hour daylight-saving day', () => {
  const now = Date.parse('2026-10-25T23:30:00+01:00');
  const buy = entity('sensor.buy', 'Buy', '0.5', {
    prices: [
      { time: '2026-10-25T00:00:00+02:00', price: 0 },
      { time: '2026-10-25T13:00:00+01:00', price: 0.5 },
      { time: '2026-10-25T22:00:00+01:00', price: 1 },
    ],
    unit_of_measurement: 'PLN/kWh',
  });
  const result = mapEnergy(buy, undefined, undefined, now, undefined, 'Europe/Warsaw');
  assert.equal(result.todayMinimum, 0);
  assert.equal(result.atDailyLow, false);
  assert.equal(result.status, 'standard');
});

test('a flat daily price range remains a valid daily low', () => {
  const now = Date.parse('2026-10-16T12:30:00Z');
  const buy = entity('sensor.buy', 'Buy', '0', {
    prices: [{ time: '2026-10-16T12:00:00Z', price: 0 }],
    unit_of_measurement: 'PLN/kWh',
  });
  const result = mapEnergy(buy, undefined, undefined, now);
  assert.equal(result.status, 'cheap');
  assert.equal(result.position, 0);
});

test('forecast responses must belong to the requested entity and include a forecast list', () => {
  const forecast = [{ datetime: '2026-10-16T13:00:00Z', temperature: 15 }];
  assert.equal(
    parseForecastResponse({ service_response: { 'weather.home': { forecast } } }, 'weather.home'),
    forecast,
  );
  for (const raw of [
    null,
    [],
    { service_response: { 'weather.other': { forecast } } },
    { service_response: { 'weather.home': { forecast: null } } },
  ]) {
    assert.throws(() => parseForecastResponse(raw, 'weather.home'));
  }
});
