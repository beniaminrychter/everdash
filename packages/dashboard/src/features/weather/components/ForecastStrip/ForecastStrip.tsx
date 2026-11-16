import { Fragment } from 'preact';
import { formatNumber, translateText, useI18n } from '@everdash/ui/i18n/index';
import type { ForecastType } from '@everdash/contracts/config/weatherForecast';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import { formatTemperature } from '../../../../shared/dashboard/readings';
import { forecastDayLabel, forecastTimeLabel } from '../../data/forecast';
import type { ForecastEntry } from '../../data/forecast';
import { useScrollEdges } from '../../hooks/useScrollEdges';
import styles from './ForecastStrip.module.css';

interface Props {
  entries: readonly ForecastEntry[];
  type: ForecastType;
  temperatureUnit: string;
  timeZone?: string;
  /** Shows only the first entries. */
  limit?: number;
  /** The entries share the width and do not scroll: a few next to the current conditions. */
  fit?: boolean;
  /** Larger cells, for a card with room to spare. */
  roomy?: boolean;
  /** Time, icon and temperature only: no low or chance of precipitation. */
  compact?: boolean;
}

export function ForecastStrip({
  entries: allEntries,
  type,
  temperatureUnit,
  timeZone,
  limit,
  fit = false,
  roomy = false,
  compact = false,
}: Props) {
  const entries = limit === undefined ? allEntries : allEntries.slice(0, limit);
  const { t, locale } = useI18n();
  const { edges, ref, update } = useScrollEdges<HTMLOListElement>(`${type}:${entries.length}`);
  const temperature = (value: number | null) =>
    value === null ? '—' : `${formatTemperature(value, locale)}${temperatureUnit}`;
  const probability = (entry: ForecastEntry) =>
    entry.precipitationProbability === null ? null : (
      <span class={styles.precipitation} title={t('Chance of precipitation')}>
        {formatNumber(entry.precipitationProbability, 0, locale)}%
      </span>
    );
  const classes = [
    styles.box,
    fit ? styles.fit : '',
    roomy ? styles.roomy : '',
    compact ? styles.compact : '',
    edges.start ? styles.moreBefore : '',
    edges.end ? styles.moreAfter : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      <ol
        key={type}
        ref={ref}
        class={styles.strip}
        aria-label={type === 'daily' ? t('Daily forecast') : t('Hourly forecast')}
        onScroll={update}
      >
        {entries.map((entry, index) => {
          const title = translateText(entry.condition, t);
          const newDay = !fit && index > 0 && entries[index - 1].day !== entry.day;

          if (type === 'daily') {
            return (
              <li key={entry.day} class={styles.day} data-forecast-day={entry.day}>
                <time dateTime={entry.day}>{forecastDayLabel(entry, locale, t)}</time>
                <span title={title}>
                  <Icon name={entry.icon} className={styles.icon} />
                  <span class={styles.hidden}>{title}</span>
                </span>
                <strong>{temperature(entry.temperature)}</strong>
                <span class={styles.low}>{temperature(entry.low)}</span>
                {probability(entry)}
              </li>
            );
          }

          return (
            <Fragment key={entry.time}>
              {newDay && (
                <li class={styles.dayBreak} data-forecast-day-break={entry.day}>
                  {forecastDayLabel(entry, locale, t)}
                </li>
              )}
              <li class={styles.hour} data-forecast-hour={entry.time}>
                <time dateTime={new Date(entry.time).toISOString()}>
                  {forecastTimeLabel(entry.time, locale, timeZone)}
                </time>
                <span title={title}>
                  <Icon name={entry.icon} className={styles.icon} />
                  <span class={styles.hidden}>{title}</span>
                </span>
                <strong>{temperature(entry.temperature)}</strong>
                {probability(entry)}
              </li>
            </Fragment>
          );
        })}
      </ol>
      {!fit && <span class={`${styles.fade} ${styles.fadeBefore}`} aria-hidden="true" />}
      {!fit && <span class={`${styles.fade} ${styles.fadeAfter}`} aria-hidden="true" />}
    </div>
  );
}
