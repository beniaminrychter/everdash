import assert from 'node:assert/strict';
import test from 'node:test';
import { mapWeather } from '@everdash/dashboard/features/weather/data/forecast';
import { weatherView } from '@everdash/dashboard/features/weather/data/view';
import { createTranslator } from '@everdash/ui/i18n/index';

const t = createTranslator('en');
const now = Date.parse('2026-10-16T14:00:00Z');
const entity = (attributes: Record<string, unknown> = {}) => ({
  attributes: {
    friendly_name: 'Home',
    humidity: 90,
    precipitation_unit: 'mm',
    pressure: 1003,
    pressure_unit: 'hPa',
    supported_features: 3,
    temperature: 7,
    temperature_unit: '°C',
    wind_bearing: 225,
    wind_speed: 16.6,
    wind_speed_unit: 'km/h',
    ...attributes,
  },
  entity_id: 'weather.home',
  state: 'cloudy',
});
const daily = [
  {
    condition: 'cloudy',
    datetime: '2026-10-16T00:00:00+02:00',
    precipitation: 0,
    temperature: 7,
    templow: 6.5,
  },
  { condition: 'sunny', datetime: '2026-10-17T00:00:00+02:00', temperature: 9, templow: 5 },
];
const view = (options: { online?: boolean; type?: 'hourly' | 'daily'; features?: number } = {}) => {
  const type = options.type ?? 'daily';

  return weatherView({
    forecastType: type,
    locale: 'en-GB',
    online: options.online ?? true,
    reading: mapWeather(entity({ supported_features: options.features ?? 3 }), daily, now, {
      dailyForecast: daily,
      timeZone: 'Europe/Warsaw',
      type,
    }),
    t,
  });
};

test('the details list humidity, wind, pressure and precipitation in that order', () => {
  const { details } = view();

  assert.deepEqual(
    details.map((detail) => [detail.key, detail.value]),
    [
      ['humidity', '90%'],
      ['wind', 'SW 16.6 km/h'],
      ['pressure', '1003 hPa'],
      ['precipitation', '0 mm'],
    ],
  );
});

test('the current conditions are readable text', () => {
  const current = view();

  assert.equal(current.temperature, '7.0°C');
  assert.equal(current.high, 'High 7.0°C');
  assert.equal(current.low, 'Low 6.5°C');
  assert.equal(current.feelsLike, null);
});

test('compact layouts get a short high and low', () => {
  const current = view();

  assert.equal(current.highShort, 'H 7.0°C');
  assert.equal(current.lowShort, 'L 6.5°C');
});

test('offline there is no forecast, no details and a dash for the temperature', () => {
  const offline = view({ online: false });

  assert.equal(offline.available, false);
  assert.deepEqual(offline.entries, []);
  assert.deepEqual(offline.details, []);
  assert.equal(offline.temperature, '—');
  assert.equal(offline.unavailable, 'Forecast unavailable offline');
});

test('a forecast type the entity lacks falls back to the other one and says so', () => {
  const fallback = view({ features: 1, type: 'hourly' });

  assert.equal(fallback.fellBack, true);
  assert.equal(fallback.forecastType, 'daily');
  assert.equal(fallback.note, 'Hourly forecast unavailable. Showing the daily forecast.');
});
