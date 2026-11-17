import assert from 'node:assert/strict';
import test from 'node:test';
import { forecastKey, resolveForecastType } from '@everdash/contracts/config/weatherForecast';
import {
  calendarDay,
  forecastDayLabel,
  mapDailyForecast,
  mapHourlyForecast,
  mapWeather,
  parseForecastResponse,
  windDirection,
} from '@everdash/dashboard/features/weather/data/forecast';
import { createTranslator } from '@everdash/ui/i18n/index';

const warsaw = 'Europe/Warsaw';
const weather = (attributes: Record<string, unknown> = {}, state = 'sunny') => ({
  attributes: { friendly_name: 'Home', temperature: 14, temperature_unit: '°C', ...attributes },
  entity_id: 'weather.home',
  state,
});
const hour = (iso: string, extra: Record<string, unknown> = {}) => ({
  condition: 'cloudy',
  datetime: iso,
  temperature: 10,
  ...extra,
});

test('wind bearings in degrees become compass labels and named directions are kept', () => {
  const labels = [0, 22, 23, 45, 90, 135, 180, 225, 270, 315, 337, 338, 359, 360, 405, -90].map(
    (degrees) => windDirection(degrees),
  );
  assert.deepEqual(labels, [
    'N',
    'N',
    'NE',
    'NE',
    'E',
    'SE',
    'S',
    'SW',
    'W',
    'NW',
    'NW',
    'N',
    'N',
    'N',
    'NE',
    'W',
  ]);
  assert.equal(windDirection('185'), 'S');
  assert.equal(windDirection('nne'), 'NNE');
  assert.equal(windDirection(' SW '), 'SW');
  for (const value of [null, undefined, '', 'sideways', {}, Number.NaN]) {
    assert.equal(windDirection(value), null);
  }
});

test('the forecast type an entity offers follows its supported_features bits', () => {
  assert.deepEqual(resolveForecastType('hourly', 3), { fellBack: false, type: 'hourly' });
  assert.deepEqual(resolveForecastType('daily', 3), { fellBack: false, type: 'daily' });
  assert.deepEqual(resolveForecastType('hourly', 1), { fellBack: true, type: 'daily' });
  assert.deepEqual(resolveForecastType('daily', 2), { fellBack: true, type: 'hourly' });
  assert.deepEqual(resolveForecastType('hourly', 7), { fellBack: false, type: 'hourly' });
  // Twice daily (4) is not a supported card type, so the entity offers nothing usable.
  assert.deepEqual(resolveForecastType('hourly', 4), { fellBack: false, type: null });
  assert.deepEqual(resolveForecastType('daily', 0), { fellBack: false, type: null });
  // An entity that does not report its features is asked for what the card wants.
  assert.deepEqual(resolveForecastType('daily', undefined), { fellBack: false, type: 'daily' });
  assert.deepEqual(resolveForecastType('hourly', '2'), { fellBack: false, type: 'hourly' });
  assert.notEqual(forecastKey('weather.home', 'hourly'), forecastKey('weather.home', 'daily'));
});

test('hourly entries start after now, are sorted and unique, and reach into tomorrow', () => {
  // 22:30 in Warsaw: one hour left today, then tomorrow.
  const now = Date.parse('2026-10-16T20:30:00Z');
  const raw = [
    hour('2026-10-16T23:00:00Z'),
    hour('2026-10-16T22:00:00Z', { temperature: 12 }),
    hour('2026-10-16T21:00:00Z', { temperature: 11 }),
    hour('2026-10-16T21:00:00Z', { temperature: 99 }),
    hour('2026-10-16T20:00:00Z', { temperature: 1 }),
    hour('2026-10-18T20:30:01Z', { temperature: 2 }),
  ];
  const entries = mapHourlyForecast(raw, now, warsaw);
  assert.deepEqual(
    entries.map((entry) => entry.temperature),
    [11, 12, 10],
  );
  assert.deepEqual(
    entries.map((entry) => [entry.day, entry.dayOffset]),
    [
      ['2026-10-16', 0],
      ['2026-10-17', 1],
      ['2026-10-17', 1],
    ],
  );
  const many = Array.from({ length: 80 }, (_, index) =>
    hour(new Date(now + (index + 1) * 1_800_000).toISOString()),
  );
  const capped = mapHourlyForecast(many, now, warsaw);
  assert.equal(capped.length, 48);
  assert.ok(capped[47].time <= now + 48 * 3_600_000);
});

const entry = (day: string, dayOffset: number) => ({ day, dayOffset });

test('day labels read Today, Tomorrow and then the weekday in the app language', () => {
  const en = createTranslator('en');
  const pl = createTranslator('pl');
  assert.equal(forecastDayLabel(entry('2026-10-16', 0), 'en-GB', en), 'Today');
  assert.equal(forecastDayLabel(entry('2026-10-17', 1), 'en-GB', en), 'Tomorrow');
  assert.equal(forecastDayLabel(entry('2026-10-18', 2), 'en-GB', en), 'Sun');
  assert.equal(forecastDayLabel(entry('2026-10-19', 3), 'en-GB', en), 'Mon');
  assert.equal(forecastDayLabel(entry('2026-10-16', 0), 'pl-PL', pl), 'Dziś');
  assert.equal(forecastDayLabel(entry('2026-10-17', 1), 'pl-PL', pl), 'Jutro');
  assert.equal(forecastDayLabel(entry('2026-10-19', 3), 'pl-PL', pl), 'pon.');
});

test('daily entries keep the calendar day they name, from today on, one per day', () => {
  const now = Date.parse('2026-10-16T14:00:00Z');
  const raw = [
    { condition: 'rainy', datetime: '2026-10-18T00:00:00+02:00', temperature: 12, templow: 6 },
    { condition: 'sunny', datetime: '2026-10-16T00:00:00+02:00', temperature: 15, templow: 8 },
    { condition: 'cloudy', datetime: '2026-10-17T00:00:00+02:00', temperature: 13, templow: 7 },
    { condition: 'sunny', datetime: '2026-10-17T12:00:00+02:00', temperature: 99, templow: 99 },
    { condition: 'sunny', datetime: '2026-10-15T00:00:00+02:00', temperature: 20, templow: 9 },
    { condition: 'sunny', datetime: '2026-10-19T00:00:00+02:00' },
    { condition: 'snowy', datetime: '2026-10-20T00:00:00+02:00', templow: -1 },
    { datetime: 'invalid', temperature: 4 },
  ];
  const days = mapDailyForecast(raw, now, warsaw);
  assert.deepEqual(
    days.map((day) => [day.day, day.dayOffset, day.temperature, day.low]),
    [
      ['2026-10-16', 0, 15, 8],
      ['2026-10-17', 1, 13, 7],
      ['2026-10-18', 2, 12, 6],
      ['2026-10-20', 4, null, -1],
    ],
  );
  // The date in the string wins over converting its instant into another time zone.
  const newYork = mapDailyForecast(
    [{ datetime: '2026-10-16T00:00:00+00:00', temperature: 15 }],
    Date.parse('2026-10-16T14:00:00Z'),
    'America/New_York',
  );
  assert.deepEqual([newYork[0].day, newYork[0].dayOffset], ['2026-10-16', 0]);
  const week = Array.from({ length: 14 }, (_, index) => ({
    datetime: `2026-10-${String(16 + index).padStart(2, '0')}T00:00:00+02:00`,
    temperature: index,
  }));
  assert.equal(mapDailyForecast(week, now, warsaw).length, 10);
});

test('the calendar day follows the dashboard time zone', () => {
  const instant = Date.parse('2026-10-16T22:30:00Z');
  assert.equal(calendarDay(instant, warsaw), '2026-10-17');
  assert.equal(calendarDay(instant, 'America/New_York'), '2026-10-16');
  assert.equal(calendarDay(instant, 'Not/AZone'), calendarDay(instant));
});

test('an entity without the requested forecast type shows the other, or says it has none', () => {
  const now = Date.parse('2026-10-16T12:30:00Z');
  const daily = [{ datetime: '2026-10-16T00:00:00+00:00', temperature: 15, templow: 8 }];
  const hourly = [hour('2026-10-16T13:00:00Z')];
  const dailyOnly = mapWeather(weather({ supported_features: 1 }), daily, now, {
    timeZone: 'UTC',
    type: 'hourly',
  });
  assert.equal(dailyOnly.forecastType, 'daily');
  assert.equal(dailyOnly.forecastFellBack, true);
  assert.equal(dailyOnly.forecast.length, 1);
  assert.equal(dailyOnly.forecast[0].low, 8);
  const hourlyOnly = mapWeather(weather({ supported_features: 2 }), hourly, now, {
    timeZone: 'UTC',
    type: 'daily',
  });
  assert.equal(hourlyOnly.forecastType, 'hourly');
  assert.equal(hourlyOnly.forecastFellBack, true);
  assert.equal(hourlyOnly.forecast.length, 1);
  const none = mapWeather(weather({ supported_features: 4 }), hourly, now, { type: 'hourly' });
  assert.equal(none.forecastType, null);
  assert.equal(none.forecastFellBack, false);
  assert.deepEqual(none.forecast, []);
  const asked = mapWeather(weather({ supported_features: 3 }), hourly, now, { type: 'hourly' });
  assert.equal(asked.forecastType, 'hourly');
  assert.equal(asked.forecastFellBack, false);
});

test("today's high and low come from the daily forecast, and stay empty without one", () => {
  const now = Date.parse('2026-10-16T12:30:00Z');
  const hourly = [hour('2026-10-16T13:00:00Z', { precipitation_probability: 40 })];
  const daily = [
    {
      datetime: '2026-10-16T00:00:00+00:00',
      precipitation_probability: 70,
      temperature: 15,
      templow: 8,
    },
    { datetime: '2026-10-17T00:00:00+00:00', temperature: 12, templow: 5 },
  ];
  const entity = weather({ supported_features: 3 });
  const withDaily = mapWeather(entity, hourly, now, { dailyForecast: daily, timeZone: 'UTC' });
  assert.equal(withDaily.todayHigh, 15);
  assert.equal(withDaily.todayLow, 8);
  assert.equal(withDaily.precipitationProbability, 70);
  const dailyCard = mapWeather(entity, daily, now, { timeZone: 'UTC', type: 'daily' });
  assert.equal(dailyCard.todayHigh, 15);
  assert.equal(dailyCard.todayLow, 8);
  const without = mapWeather(entity, hourly, now, { timeZone: 'UTC' });
  assert.equal(without.todayHigh, null);
  assert.equal(without.todayLow, null);
  assert.equal(without.precipitationProbability, 40);
  const tomorrowOnly = mapWeather(entity, hourly, now, {
    dailyForecast: daily.slice(1),
    timeZone: 'UTC',
  });
  assert.equal(tomorrowOnly.todayHigh, null);
});

test('current conditions use the units the entity reports and omit what it does not', () => {
  const now = Date.parse('2026-10-16T12:30:00Z');
  const full = mapWeather(
    weather({
      apparent_temperature: 11.5,
      humidity: 61,
      precipitation_unit: 'mm',
      pressure: 1013.2,
      pressure_unit: 'hPa',
      wind_bearing: 225,
      wind_speed: 12.4,
      wind_speed_unit: 'km/h',
    }),
    [],
    now,
  );
  assert.equal(full.feelsLike, 11.5);
  assert.equal(full.humidity, 61);
  assert.equal(full.pressure, 1013.2);
  assert.equal(full.pressureUnit, 'hPa');
  assert.equal(full.windSpeed, 12.4);
  assert.equal(full.windUnit, 'km/h');
  assert.equal(full.windDirection, 'SW');
  assert.equal(full.precipitationUnit, 'mm');
  const bare = mapWeather(weather(), [], now);
  assert.equal(bare.feelsLike, null);
  assert.equal(bare.humidity, null);
  assert.equal(bare.pressure, null);
  assert.equal(bare.windSpeed, null);
  assert.equal(bare.windDirection, null);
  assert.equal(bare.precipitation, null);
  assert.equal(bare.precipitationProbability, null);
});

test('forecast entries carry the extra fields Home Assistant sends and nothing it does not', () => {
  const now = Date.parse('2026-10-16T12:30:00Z');
  const [night, plain] = mapHourlyForecast(
    [
      hour('2026-10-16T13:00:00Z', {
        condition: 'sunny',
        humidity: 70,
        is_daytime: false,
        precipitation: 0.4,
        precipitation_probability: 35,
        wind_bearing: 90,
        wind_speed: 8,
      }),
      { datetime: '2026-10-16T14:00:00Z', temperature: 9 },
    ],
    now,
    'UTC',
  );
  assert.equal(night.icon, 'moon');
  assert.equal(night.isDaytime, false);
  assert.equal(night.precipitation, 0.4);
  assert.equal(night.precipitationProbability, 35);
  assert.equal(night.windDirection, 'E');
  assert.equal(night.windSpeed, 8);
  assert.equal(night.humidity, 70);
  assert.equal(plain.condition, 'Forecast');
  assert.equal(plain.precipitationProbability, null);
  assert.equal(plain.windDirection, null);
  assert.equal(plain.isDaytime, null);
  assert.equal(plain.low, null);
  assert.deepEqual(
    ['lightning', 'snowy', 'rainy', 'windy', 'partlycloudy'].map(
      (condition) =>
        mapHourlyForecast([hour('2026-10-16T13:00:00Z', { condition })], now, 'UTC')[0].icon,
    ),
    ['storm', 'snow', 'rain', 'wind', 'cloud'],
  );
});

test('forecast responses name the entity and a forecast list', () => {
  const forecast = [{ datetime: '2026-10-16T13:00:00Z', temperature: 15 }];
  assert.equal(
    parseForecastResponse({ service_response: { 'weather.home': { forecast } } }, 'weather.home'),
    forecast,
  );
  assert.throws(
    () => parseForecastResponse({ service_response: { 'weather.home': {} } }, 'weather.home'),
    /Forecast unavailable/,
  );
});
