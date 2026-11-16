import type { ForecastType } from '@everdash/contracts/config/weatherForecast';
import { translateText } from '@everdash/ui/i18n/index';
import type { Translator } from '@everdash/ui/i18n/index';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import { formatTemperature } from '../../../shared/dashboard/readings';
import type { ForecastEntry, WeatherReading } from './forecast';

export interface WeatherDetail {
  key: string;
  icon: IconName;
  label: string;
  value: string;
}

/** What a weather card shows, as display text: the layouts only arrange it. */
export interface WeatherView {
  available: boolean;
  icon: IconName;
  /** The current temperature with its unit, or a dash when there is none. */
  temperature: string;
  condition: string;
  feelsLike: string | null;
  high: string | null;
  low: string | null;
  /** The high and low in the short form compact layouts use ("H 7.0°C"). */
  highShort: string | null;
  lowShort: string | null;
  details: WeatherDetail[];
  entries: readonly ForecastEntry[];
  /** The type the entries belong to; null when the entity offers no usable forecast. */
  forecastType: ForecastType | null;
  fellBack: boolean;
  /** Says the other forecast type is shown, when the requested one is not offered. */
  note: string;
  /** Shown in place of the forecast when there are no entries. */
  unavailable: string;
}

interface WeatherViewInput {
  reading: WeatherReading;
  /** The forecast type the card asked for; the entity may only offer the other one. */
  forecastType: ForecastType;
  online: boolean;
  locale: string;
  t: Translator;
}

const formatReading = (value: number, locale: string, digits = 0) =>
  value.toLocaleString(locale, { maximumFractionDigits: digits, useGrouping: false });

export function weatherView({
  reading,
  forecastType,
  online,
  locale,
  t,
}: WeatherViewInput): WeatherView {
  const available = online && reading.available;
  const unit = reading.temperatureUnit;
  const temperature = (value: number) => `${formatTemperature(value, locale)}${unit}`;
  const details: WeatherDetail[] = [];

  if (available) {
    if (reading.humidity !== null) {
      details.push({
        icon: 'humidity',
        key: 'humidity',
        label: t('Humidity'),
        value: `${formatReading(reading.humidity, locale)}%`,
      });
    }
    if (reading.windSpeed !== null) {
      details.push({
        icon: 'wind',
        key: 'wind',
        label: t('Wind'),
        value: [
          reading.windDirection,
          `${formatReading(reading.windSpeed, locale, 1)} ${reading.windUnit}`.trim(),
        ]
          .filter(Boolean)
          .join(' '),
      });
    }
    if (reading.pressure !== null) {
      details.push({
        icon: 'gauge',
        key: 'pressure',
        label: t('Pressure'),
        value: `${formatReading(reading.pressure, locale)} ${reading.pressureUnit}`.trim(),
      });
    }
    if (reading.precipitationProbability !== null) {
      details.push({
        icon: 'umbrella',
        key: 'precipitation',
        label: t('Chance of precipitation'),
        value: `${formatReading(reading.precipitationProbability, locale)}%`,
      });
    } else if (reading.precipitation !== null) {
      details.push({
        icon: 'umbrella',
        key: 'precipitation',
        label: t('Precipitation'),
        value:
          `${formatReading(reading.precipitation, locale, 1)} ${reading.precipitationUnit}`.trim(),
      });
    }
  }

  const shownType = reading.forecastType ?? forecastType;

  return {
    available,
    condition: available
      ? translateText(reading.condition, t)
      : online
        ? t('Weather unavailable')
        : t('Offline'),
    details,
    entries: available ? reading.forecast : [],
    feelsLike:
      available && reading.feelsLike !== null
        ? t('Feels like {value}', { value: temperature(reading.feelsLike) })
        : null,
    fellBack: reading.forecastFellBack,
    forecastType: reading.forecastType,
    high:
      available && reading.todayHigh !== null
        ? t('High {value}', { value: temperature(reading.todayHigh) })
        : null,
    highShort:
      available && reading.todayHigh !== null
        ? t('H {value}', { value: temperature(reading.todayHigh) })
        : null,
    icon: reading.icon,
    low:
      available && reading.todayLow !== null
        ? t('Low {value}', { value: temperature(reading.todayLow) })
        : null,
    lowShort:
      available && reading.todayLow !== null
        ? t('L {value}', { value: temperature(reading.todayLow) })
        : null,
    note:
      shownType === 'daily'
        ? t('Hourly forecast unavailable. Showing the daily forecast.')
        : t('Daily forecast unavailable. Showing the hourly forecast.'),
    temperature: available && reading.temperature !== null ? temperature(reading.temperature) : '—',
    unavailable: !online
      ? t('Forecast unavailable offline')
      : shownType === 'daily'
        ? t('Daily forecast unavailable')
        : t('Hourly forecast unavailable'),
  };
}
