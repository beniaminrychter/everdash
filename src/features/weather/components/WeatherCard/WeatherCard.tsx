import { useI18n, translateText } from '../../../../shared/i18n/index';
import { formatTemperature } from '../../../../shared/dashboard/readings';
import { mapWeather } from '../../data/forecast';
import type { Entity } from '../../../../shared/home-assistant/entities';
import { Widget } from '../../../../shared/ui/Widget/Widget';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import styles from './WeatherCard.module.css';

interface Props {
  entity: Entity | undefined;
  forecast?: readonly unknown[];
  title?: string;
  titleId?: string;
  online: boolean;
  now: number;
  timeZone?: string;
}
export function WeatherCard({
  entity,
  forecast: rawForecast,
  online,
  now,
  timeZone,
  title,
  titleId = 'weather-title',
}: Props) {
  const { t, locale } = useI18n();
  const reading = mapWeather(entity, rawForecast, now);
  const available = online && reading.available;
  const forecast = available ? reading.forecast : [];
  return (
    <Widget title={title || t('Current weather')} titleId={titleId}>
      <div class={styles.strip}>
        <div class={styles.current}>
          <Icon name={reading.icon} className={styles.currentIcon} />
          <div>
            <strong class={styles.temperature} data-testid="weather-temperature">
              {available && reading.temperature !== null
                ? `${formatTemperature(reading.temperature, locale)}${reading.temperatureUnit}`
                : '—'}
            </strong>
            <p class={styles.condition}>
              {available
                ? translateText(reading.condition, t)
                : online
                  ? t('Weather unavailable')
                  : t('Offline')}
            </p>
          </div>
        </div>
        {forecast.length ? (
          <ol class={styles.forecast} aria-label={t('Next five hours')}>
            {forecast.map((hour) => (
              <li key={hour.time} data-forecast-hour={hour.time}>
                <time dateTime={new Date(hour.time).toISOString()}>
                  {new Date(hour.time).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone,
                  })}
                </time>
                <span title={translateText(hour.condition, t)}>
                  <Icon name={hour.icon} className={styles.hourIcon} />
                  <span class={styles.conditionLabel}>{translateText(hour.condition, t)}</span>
                </span>
                <strong>
                  {formatTemperature(hour.temperature, locale)}
                  {reading.temperatureUnit}
                </strong>
              </li>
            ))}
          </ol>
        ) : (
          <p class={styles.note}>
            {online ? t('Hourly forecast unavailable') : t('Forecast unavailable offline')}
          </p>
        )}
      </div>
    </Widget>
  );
}
