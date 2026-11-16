import { useI18n, translateText } from '@everdash/ui/i18n/index';
import type { CardSize } from '@everdash/contracts/config/cardSize';
import { defaultForecastType } from '@everdash/contracts/config/weatherForecast';
import type { ForecastType } from '@everdash/contracts/config/weatherForecast';
import { formatTemperature } from '../../../../shared/dashboard/readings';
import { mapWeather } from '../../data/forecast';
import type { Entity } from '../../../../shared/home-assistant/entities';
import { Widget } from '@everdash/ui/ui/Widget/Widget';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import { ForecastStrip } from '../ForecastStrip/ForecastStrip';
import styles from './WeatherCard.module.css';

interface Props {
  entity: Entity | undefined;
  /** The forecast the card asked for, as Home Assistant returned it. */
  forecast?: readonly unknown[];
  /** The daily forecast, read for today's high and low when the card shows hourly entries. */
  dailyForecast?: readonly unknown[];
  /** The forecast the card asked for; the entity may only offer the other one. */
  forecastType?: ForecastType;
  title?: string;
  titleId?: string;
  online: boolean;
  now: number;
  timeZone?: string;
  /** Narrower than the full row, the forecast moves below the current conditions. */
  size?: CardSize;
}

interface Detail {
  key: string;
  icon: IconName;
  label: string;
  value: string;
}

const sizeClasses: Record<CardSize, string> = {
  third: styles.third,
  half: styles.half,
  full: styles.full,
};

const formatReading = (value: number, locale: string, digits = 0) =>
  value.toLocaleString(locale, { maximumFractionDigits: digits, useGrouping: false });

export function WeatherCard({
  entity,
  forecast: rawForecast,
  dailyForecast,
  forecastType = defaultForecastType,
  online,
  now,
  timeZone,
  title,
  titleId = 'weather-title',
  size = 'full',
}: Props) {
  const { t, locale } = useI18n();
  const reading = mapWeather(entity, rawForecast, now, {
    dailyForecast,
    timeZone,
    type: forecastType,
  });
  const available = online && reading.available;
  const entries = available ? reading.forecast : [];
  const unit = reading.temperatureUnit;
  const temperature = (value: number) => `${formatTemperature(value, locale)}${unit}`;
  const details: Detail[] = [];

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
  const unavailable = !online
    ? t('Forecast unavailable offline')
    : shownType === 'daily'
      ? t('Daily forecast unavailable')
      : t('Hourly forecast unavailable');
  const fallbackNote =
    shownType === 'daily'
      ? t('Hourly forecast unavailable. Showing the daily forecast.')
      : t('Daily forecast unavailable. Showing the hourly forecast.');

  return (
    <Widget title={title || t('Current weather')} titleId={titleId}>
      <div class={`${styles.strip} ${sizeClasses[size]}`}>
        <div class={styles.summary}>
          <div class={styles.current}>
            <Icon name={reading.icon} className={styles.currentIcon} />
            <div class={styles.readout}>
              <strong class={styles.temperature} data-testid="weather-temperature">
                {available && reading.temperature !== null ? temperature(reading.temperature) : '—'}
              </strong>
              <p class={styles.condition}>
                {available
                  ? translateText(reading.condition, t)
                  : online
                    ? t('Weather unavailable')
                    : t('Offline')}
              </p>
              {available && reading.feelsLike !== null && (
                <p class={styles.note} data-testid="weather-feels-like">
                  {t('Feels like {value}', { value: temperature(reading.feelsLike) })}
                </p>
              )}
              {available && (reading.todayHigh !== null || reading.todayLow !== null) && (
                <p class={styles.range} data-testid="weather-range">
                  {reading.todayHigh !== null && (
                    <span>{t('High {value}', { value: temperature(reading.todayHigh) })}</span>
                  )}
                  {reading.todayLow !== null && (
                    <span>{t('Low {value}', { value: temperature(reading.todayLow) })}</span>
                  )}
                </p>
              )}
            </div>
          </div>
          {details.length > 0 && (
            <ul class={styles.details} data-testid="weather-details">
              {details.map((detail) => (
                <li key={detail.key} title={detail.label}>
                  <Icon name={detail.icon} className={styles.detailIcon} />
                  <span class={styles.hidden}>{detail.label}</span>
                  <span>{detail.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {entries.length > 0 && reading.forecastType ? (
          <div class={styles.forecast}>
            <ForecastStrip
              entries={entries}
              type={reading.forecastType}
              temperatureUnit={unit}
              timeZone={timeZone}
            />
            {reading.forecastFellBack && <p class={styles.fallback}>{fallbackNote}</p>}
          </div>
        ) : (
          <p class={styles.unavailable}>{unavailable}</p>
        )}
      </div>
    </Widget>
  );
}
