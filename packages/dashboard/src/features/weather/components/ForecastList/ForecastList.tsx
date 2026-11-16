import { translateText, useI18n } from '@everdash/ui/i18n/index';
import type { ForecastType } from '@everdash/contracts/config/weatherForecast';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import { formatTemperature } from '../../../../shared/dashboard/readings';
import { forecastDayLabel, forecastTimeLabel } from '../../data/forecast';
import type { ForecastEntry } from '../../data/forecast';
import styles from './ForecastList.module.css';

interface Props {
  entries: readonly ForecastEntry[];
  type: ForecastType;
  temperatureUnit: string;
  timeZone?: string;
}

/** A few forecast entries one under the other: time or day, icon, temperature. Never scrolls. */
export function ForecastList({ entries, type, temperatureUnit, timeZone }: Props) {
  const { t, locale } = useI18n();
  const temperature = (value: number | null) =>
    value === null ? '—' : `${formatTemperature(value, locale)}${temperatureUnit}`;

  return (
    <ol
      class={styles.list}
      aria-label={type === 'daily' ? t('Daily forecast') : t('Hourly forecast')}
    >
      {entries.map((entry) => {
        const title = translateText(entry.condition, t);
        const icon = (
          <span title={title} class={styles.icon}>
            <Icon name={entry.icon} className={styles.glyph} />
            <span class={styles.hidden}>{title}</span>
          </span>
        );

        if (type === 'daily') {
          return (
            <li key={entry.day} class={styles.row} data-forecast-day={entry.day}>
              <time dateTime={entry.day}>{forecastDayLabel(entry, locale, t)}</time>
              {icon}
              <strong>{temperature(entry.temperature)}</strong>
            </li>
          );
        }

        return (
          <li key={entry.time} class={styles.row} data-forecast-hour={entry.time}>
            <time dateTime={new Date(entry.time).toISOString()}>
              {forecastTimeLabel(entry.time, locale, timeZone)}
            </time>
            {icon}
            <strong>{temperature(entry.temperature)}</strong>
          </li>
        );
      })}
    </ol>
  );
}
