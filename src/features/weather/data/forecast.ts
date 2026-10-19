import type { Entity } from '../../../shared/home-assistant/entities';
import { hasState } from '../../../shared/dashboard/readings';
import { isRecord } from '../../../shared/home-assistant/entities';
import { parseScheduleTime } from '../../../shared/time/schedule';
import type { IconName } from '../../../shared/ui/Icon/Icon';

const number = (value: unknown): number | null => {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    return null;
  }
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};
const conditions: Record<string, string> = {
  'clear-night': 'Clear night',
  cloudy: 'Cloudy',
  exceptional: 'Exceptional conditions',
  fog: 'Foggy',
  hail: 'Hail',
  lightning: 'Thunderstorms',
  'lightning-rainy': 'Thunderstorms and rain',
  partlycloudy: 'Partly cloudy',
  pouring: 'Heavy rain',
  rainy: 'Rainy',
  snowy: 'Snowy',
  'snowy-rainy': 'Sleet',
  sunny: 'Sunny',
  windy: 'Windy',
  'windy-variant': 'Windy and cloudy',
};
const weatherIcon = (condition: string): IconName =>
  condition === 'sunny'
    ? 'sun'
    : condition === 'clear-night'
      ? 'moon'
      : /rain|pouring|lightning|hail/.test(condition)
        ? 'rain'
        : 'cloud';
export function parseForecastResponse(raw: unknown, entityId: string): readonly unknown[] {
  if (!isRecord(raw) || !isRecord(raw.service_response)) {
    throw new Error('Invalid weather forecast response.');
  }
  const result = raw.service_response[entityId];
  if (!isRecord(result) || !Array.isArray(result.forecast)) {
    throw new Error('Hourly forecast unavailable.');
  }
  return result.forecast;
}
export function mapWeather(
  entity: Entity | undefined,
  rawForecast?: readonly unknown[],
  now = Date.now(),
) {
  const available = hasState(entity);
  const attributes = available ? entity.attributes : {};
  const condition = available
    ? conditions[entity.state] || entity.state.replace(/-/g, ' ')
    : 'Weather unavailable';
  const icon = weatherIcon(available ? entity.state : '');
  const hours = new Map<
    number,
    { time: number; temperature: number; condition: string; icon: IconName }
  >();
  (rawForecast || []).forEach((item) => {
    if (!isRecord(item)) {
      return;
    }
    const time = parseScheduleTime(item.datetime);
    const temperature = number(item.temperature);
    if (
      !Number.isFinite(time) ||
      time <= now ||
      time > now + 5 * 3_600_000 ||
      temperature === null ||
      hours.has(time)
    ) {
      return;
    }
    const hourCondition = typeof item.condition === 'string' ? item.condition : '';
    hours.set(time, {
      condition: conditions[hourCondition] || hourCondition.replace(/-/g, ' ') || 'Forecast',
      icon: weatherIcon(hourCondition),
      temperature,
      time,
    });
  });
  const forecast = [...hours.values()].sort((a, b) => a.time - b.time).slice(0, 5);
  return {
    available,
    condition,
    feelsLike: number(attributes.apparent_temperature),
    forecast,
    humidity: number(attributes.humidity),
    icon,
    name: typeof attributes.friendly_name === 'string' ? attributes.friendly_name : 'Outside',
    temperature: number(attributes.temperature),
    temperatureUnit:
      typeof attributes.temperature_unit === 'string' ? attributes.temperature_unit : '',
    windSpeed: number(attributes.wind_speed),
    windUnit: typeof attributes.wind_speed_unit === 'string' ? attributes.wind_speed_unit : '',
  };
}
export type WeatherReading = ReturnType<typeof mapWeather>;
