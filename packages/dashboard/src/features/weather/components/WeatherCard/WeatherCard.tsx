import { useI18n } from '@everdash/ui/i18n/index';
import type { CardRows } from '@everdash/contracts/config/cardRows';
import { defaultCardRows } from '@everdash/contracts/config/cardRows';
import type { CardSize } from '@everdash/contracts/config/cardSize';
import { defaultForecastType } from '@everdash/contracts/config/weatherForecast';
import type { ForecastType } from '@everdash/contracts/config/weatherForecast';
import { mapWeather } from '../../data/forecast';
import { weatherView } from '../../data/view';
import type { WeatherView } from '../../data/view';
import type { Entity } from '../../../../shared/home-assistant/entities';
import { Widget } from '@everdash/ui/ui/Widget/Widget';
import { ForecastList } from '../ForecastList/ForecastList';
import { ForecastStrip } from '../ForecastStrip/ForecastStrip';
import { WeatherCurrent } from '../WeatherCurrent/WeatherCurrent';
import { WeatherDetails } from '../WeatherDetails/WeatherDetails';
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
  /** How wide the card is drawn; each size has its own layout. */
  size?: CardSize;
  /** One row is as tall as an accessory tile, two rows as two tiles. */
  rows?: CardRows;
}

/** How a layout shows the forecast: a short vertical list, a few entries across, or the full strip. */
type ForecastKind = 'list' | 'fit' | 'strip';

/** The entries a short forecast shows. */
const shortForecast = 4;

const layoutClasses: Record<CardSize, string> = {
  quarter: styles.quarter,
  half: styles.half,
  full: styles.full,
};
const rowClasses: Record<CardRows, string> = { 1: styles.oneRow, 2: styles.twoRows };

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
  rows = defaultCardRows,
}: Props) {
  const { t, locale } = useI18n();
  const reading = mapWeather(entity, rawForecast, now, {
    dailyForecast,
    timeZone,
    type: forecastType,
  });
  const view = weatherView({ forecastType, locale, online, reading, t });

  const forecast = (kind: ForecastKind, view: WeatherView, limit = shortForecast) => {
    if (view.entries.length === 0 || !view.forecastType) {
      return <p class={styles.unavailable}>{view.unavailable}</p>;
    }

    const common = {
      temperatureUnit: reading.temperatureUnit,
      timeZone,
      type: view.forecastType,
    };

    return (
      <div class={styles.forecast}>
        {kind === 'list' && (
          <ForecastList entries={view.entries.slice(0, shortForecast)} {...common} />
        )}
        {kind === 'fit' && (
          <ForecastStrip
            entries={view.entries}
            limit={limit}
            fit
            compact={rows === 1}
            {...common}
          />
        )}
        {kind === 'strip' && <ForecastStrip entries={view.entries} roomy {...common} />}
        {view.fellBack && <p class={styles.fallback}>{view.note}</p>}
      </div>
    );
  };

  return (
    <Widget
      title={title || t('Current weather')}
      titleId={titleId}
      className={`${styles.card} ${layoutClasses[size]} ${rowClasses[rows]}`}
      hideTitle
    >
      {rows === 1 && size === 'quarter' && (
        <WeatherCurrent view={view} variant="glance" size="quarter" />
      )}
      {rows === 1 && size === 'half' && (
        <div class={styles.row}>
          <div class={styles.zone}>
            <WeatherCurrent view={view} variant="glance" size="half" />
          </div>
          {forecast('fit', view, 3)}
        </div>
      )}
      {rows === 1 && size === 'full' && (
        <div class={styles.row}>
          <div class={styles.zone}>
            <WeatherCurrent view={view} variant="inline" size="full" />
          </div>
          <div class={styles.rowDetails}>
            <WeatherDetails details={view.details} layout="grid" />
          </div>
          {forecast('fit', view, 5)}
        </div>
      )}
      {rows === 2 && size === 'quarter' && (
        <>
          <WeatherCurrent view={view} variant="inline" size="quarter" />
          <div class={styles.list}>{forecast('list', view)}</div>
        </>
      )}
      {rows === 2 && size === 'half' && (
        <>
          <WeatherCurrent view={view} variant="inline" size="half" />
          <div class={styles.details}>
            <WeatherDetails details={view.details} layout="grid" />
          </div>
          {forecast('fit', view)}
        </>
      )}
      {rows === 2 && size === 'full' && (
        <>
          <div class={styles.top}>
            <WeatherCurrent view={view} variant="large" size="full" />
            <WeatherDetails details={view.details} layout="row" />
          </div>
          {forecast('strip', view)}
        </>
      )}
    </Widget>
  );
}
