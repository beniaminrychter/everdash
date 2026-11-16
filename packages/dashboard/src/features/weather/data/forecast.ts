import type { Entity } from '../../../shared/home-assistant/entities';
import { hasState } from '../../../shared/dashboard/readings';
import { isRecord } from '../../../shared/home-assistant/entities';
import { parseScheduleTime } from '../../../shared/time/schedule';
import {
  defaultForecastType,
  resolveForecastType,
} from '@everdash/contracts/config/weatherForecast';
import type { ForecastType } from '@everdash/contracts/config/weatherForecast';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import type { Translator } from '@everdash/ui/i18n/index';

/** The hourly strip reaches far enough to scroll into tomorrow, whenever the card is read. */
const hourlyWindowMs = 48 * 3_600_000;
const maxHourlyEntries = 48;
const maxDailyEntries = 10;
const dayMs = 86_400_000;

const number = (value: unknown): number | null => {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    return null;
  }
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
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
const weatherIcon = (condition: string, isDaytime?: boolean | null): IconName =>
  condition === 'sunny'
    ? isDaytime === false
      ? 'moon'
      : 'sun'
    : condition === 'clear-night'
      ? 'moon'
      : /lightning/.test(condition)
        ? 'storm'
        : /snow/.test(condition)
          ? 'snow'
          : /rain|pouring|hail/.test(condition)
            ? 'rain'
            : /windy/.test(condition)
              ? 'wind'
              : 'cloud';
const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Compass label of a wind bearing: degrees (0-360) or a direction Home Assistant already named. */
export function windDirection(bearing: unknown): string | null {
  if (typeof bearing === 'string' && /^[NESW]{1,3}$/i.test(bearing.trim())) {
    return bearing.trim().toUpperCase();
  }
  const degrees = number(bearing);
  if (degrees === null) {
    return null;
  }
  return compass[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const dateKeyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The calendar date of a moment in the dashboard time zone, as yyyy-mm-dd. */
export function calendarDay(time: number, timeZone?: string): string {
  const zone = timeZone || '';
  let formatter = dateFormatters.get(zone);
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        timeZone: timeZone || undefined,
        year: 'numeric',
      });
    } catch {
      formatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    dateFormatters.set(zone, formatter);
  }
  const [day, month, year] = formatter.format(new Date(time)).split('/');
  return `${year}-${month}-${day}`;
}

const dayNumber = (key: string): number => {
  const match = key.match(dateKeyPattern);
  return match ? Date.UTC(+match[1], +match[2] - 1, +match[3]) / dayMs : NaN;
};

export interface ForecastEntry {
  time: number;
  /** yyyy-mm-dd of the forecast, in the dashboard time zone. */
  day: string;
  /** Calendar days after today: 0 is today, 1 is tomorrow. */
  dayOffset: number;
  condition: string;
  icon: IconName;
  /** The temperature of an hour, or the high of a day. */
  temperature: number | null;
  /** The low of a day; hourly entries have none. */
  low: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  humidity: number | null;
  isDaytime: boolean | null;
}

function parseEntry(
  item: unknown,
  now: number,
  timeZone: string | undefined,
  namesDay: boolean,
): ForecastEntry | null {
  if (!isRecord(item)) {
    return null;
  }
  const time = parseScheduleTime(item.datetime, timeZone);
  if (!Number.isFinite(time)) {
    return null;
  }
  const condition = text(item.condition);
  const isDaytime = typeof item.is_daytime === 'boolean' ? item.is_daytime : null;
  // A daily forecast names a calendar date; keep that date rather than converting its instant.
  const named = namesDay && typeof item.datetime === 'string' ? item.datetime.slice(0, 10) : '';
  const day = dateKeyPattern.test(named) ? named : calendarDay(time, timeZone);
  return {
    condition: conditions[condition] || condition.replace(/-/g, ' ') || 'Forecast',
    day,
    dayOffset: dayNumber(day) - dayNumber(calendarDay(now, timeZone)),
    humidity: number(item.humidity),
    icon: weatherIcon(condition, isDaytime),
    isDaytime,
    low: number(item.templow),
    precipitation: number(item.precipitation),
    precipitationProbability: number(item.precipitation_probability),
    temperature: number(item.temperature),
    time,
    windDirection: windDirection(item.wind_bearing),
    windSpeed: number(item.wind_speed),
  };
}

/** The hours after now, soonest first, with enough of them to scroll into tomorrow. */
export function mapHourlyForecast(
  raw: readonly unknown[] | undefined,
  now: number,
  timeZone?: string,
): ForecastEntry[] {
  const hours = new Map<number, ForecastEntry>();
  (raw || []).forEach((item) => {
    const entry = parseEntry(item, now, timeZone, false);
    if (
      !entry ||
      entry.time <= now ||
      entry.time > now + hourlyWindowMs ||
      entry.temperature === null ||
      hours.has(entry.time)
    ) {
      return;
    }
    hours.set(entry.time, entry);
  });
  return [...hours.values()].sort((a, b) => a.time - b.time).slice(0, maxHourlyEntries);
}

/** Today and the days after it, one per calendar day, with a high, a low or both. */
export function mapDailyForecast(
  raw: readonly unknown[] | undefined,
  now: number,
  timeZone?: string,
): ForecastEntry[] {
  const days = new Map<string, ForecastEntry>();
  (raw || []).forEach((item) => {
    const entry = parseEntry(item, now, timeZone, true);
    if (
      !entry ||
      entry.dayOffset < 0 ||
      (entry.temperature === null && entry.low === null) ||
      days.has(entry.day)
    ) {
      return;
    }
    days.set(entry.day, entry);
  });
  return [...days.values()].sort((a, b) => a.dayOffset - b.dayOffset).slice(0, maxDailyEntries);
}

/** "Today", "Tomorrow", then the short weekday of the calendar day in the app language. */
export function forecastDayLabel(
  entry: Pick<ForecastEntry, 'day' | 'dayOffset'>,
  locale: string,
  t: Translator,
): string {
  if (entry.dayOffset === 0) {
    return t('Today');
  }
  if (entry.dayOffset === 1) {
    return t('Tomorrow');
  }
  const match = entry.day.match(dateKeyPattern);
  if (!match) {
    return '';
  }
  // Noon UTC names the same weekday as the calendar day in every time zone.
  return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], 12)).toLocaleDateString(locale, {
    timeZone: 'UTC',
    weekday: 'short',
  });
}

export function parseForecastResponse(raw: unknown, entityId: string): readonly unknown[] {
  if (!isRecord(raw) || !isRecord(raw.service_response)) {
    throw new Error('Invalid weather forecast response.');
  }
  const result = raw.service_response[entityId];
  if (!isRecord(result) || !Array.isArray(result.forecast)) {
    throw new Error('Forecast unavailable.');
  }
  return result.forecast;
}

export interface WeatherOptions {
  /** The forecast the card asks for; defaults to the hourly forecast. */
  type?: ForecastType;
  timeZone?: string;
  /** A daily forecast to read today's high and low from when the card shows hourly entries. */
  dailyForecast?: readonly unknown[];
}

export function mapWeather(
  entity: Entity | undefined,
  rawForecast?: readonly unknown[],
  now = Date.now(),
  options: WeatherOptions = {},
) {
  const { dailyForecast, timeZone, type = defaultForecastType } = options;
  const available = hasState(entity);
  const attributes = available ? entity.attributes : {};
  const condition = available
    ? conditions[entity.state] || entity.state.replace(/-/g, ' ')
    : 'Weather unavailable';
  const icon = weatherIcon(available ? entity.state : '');
  const resolved = resolveForecastType(type, attributes.supported_features);
  const forecast =
    resolved.type === 'daily'
      ? mapDailyForecast(rawForecast, now, timeZone)
      : resolved.type === 'hourly'
        ? mapHourlyForecast(rawForecast, now, timeZone)
        : [];
  const days =
    resolved.type === 'daily' ? forecast : mapDailyForecast(dailyForecast, now, timeZone);
  const today = days.find((entry) => entry.dayOffset === 0) || null;
  const outlook = today || forecast[0] || null;
  return {
    available,
    condition,
    feelsLike: number(attributes.apparent_temperature),
    forecast,
    /** The requested forecast type is not offered by the entity, so the other one is shown. */
    forecastFellBack: resolved.fellBack,
    /** The forecast type the entries belong to; null when the entity offers neither. */
    forecastType: resolved.type,
    humidity: number(attributes.humidity),
    icon,
    name: typeof attributes.friendly_name === 'string' ? attributes.friendly_name : 'Outside',
    precipitation: outlook ? outlook.precipitation : null,
    precipitationProbability: outlook ? outlook.precipitationProbability : null,
    precipitationUnit: text(attributes.precipitation_unit),
    pressure: number(attributes.pressure),
    pressureUnit: text(attributes.pressure_unit),
    temperature: number(attributes.temperature),
    temperatureUnit: text(attributes.temperature_unit),
    todayHigh: today ? today.temperature : null,
    todayLow: today ? today.low : null,
    windDirection: windDirection(attributes.wind_bearing),
    windSpeed: number(attributes.wind_speed),
    windUnit: text(attributes.wind_speed_unit),
  };
}
export type WeatherReading = ReturnType<typeof mapWeather>;
