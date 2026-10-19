import { useState } from 'preact/hooks';
import type { Entity } from '../../../../shared/home-assistant/entities';
import { mapEnergy, powerKilowatts } from '../../data/readings';
import { formatEnergyValue } from '../../data/format';
import { PriceChart } from '../PriceChart';
import { useI18n } from '../../../../shared/i18n/index';
import { Widget } from '../../../../shared/ui/Widget/Widget';
import styles from './EnergyCard.module.css';

interface Props {
  buyEntity: Entity | undefined;
  sellEntity: Entity | undefined;
  nextEntity: Entity | undefined;
  scheduleEntity: Entity | undefined;
  usageEntity: Entity | undefined;
  title?: string;
  titleId?: string;
  online: boolean;
  now: number;
  timeZone?: string;
}
export function EnergyCard({
  buyEntity,
  sellEntity,
  nextEntity,
  scheduleEntity,
  usageEntity,
  online,
  now,
  timeZone,
  title,
  titleId = 'energy-title',
}: Props) {
  const { t, locale } = useI18n();
  const reading = mapEnergy(buyEntity, sellEntity, nextEntity, now, scheduleEntity, timeZone);
  const usage = powerKilowatts(usageEntity);
  const [chartOpen, setChartOpen] = useState(false);
  const chartId = `${titleId}-chart`;
  // A new schedule remounts chart selection; current price updates do not.
  const scheduleKey = `${reading.currency}:${reading.slots
    .map((slot) => `${slot.time},${slot.end},${slot.price}`)
    .join(';')}`;
  const tone = online && reading.buy !== null ? reading.status : 'unknown';
  const label = {
    cheap:
      reading.todayMinimum === null
        ? t('Low price')
        : reading.atDailyLow
          ? t('Lowest today')
          : t('Near today’s low'),
    expensive: t('High price'),
    standard: t('Standard price'),
    unknown: t('Current price'),
  }[tone];
  const status = online
    ? reading.buy === null
      ? t('Pstryk price unavailable. Connect a price sensor in Home Assistant.')
      : ''
    : t('Offline · prices unavailable');
  return (
    <Widget
      title={title || t('Energy')}
      titleId={titleId}
      headerAction={
        <button
          type="button"
          class={styles.chartToggle}
          data-testid="energy-chart-toggle"
          aria-label={chartOpen ? t('Hide price chart') : t('Show price chart')}
          aria-expanded={chartOpen}
          aria-controls={chartId}
          onClick={() => setChartOpen((open) => !open)}
        >
          <svg
            viewBox="0 0 24 24"
            width="19"
            height="19"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 4v16h16M8 15v-4M13 15V7M18 15v-6" />
          </svg>
        </button>
      }
    >
      {chartOpen && (
        <div id={chartId} class={styles.schedule} data-testid="energy-chart">
          {online && reading.slots.length ? (
            <PriceChart key={scheduleKey} reading={reading} now={now} timeZone={timeZone} />
          ) : (
            <p class={styles.empty}>
              {online
                ? t('A price chart appears when your sensor publishes a timestamped schedule.')
                : t('Offline · prices unavailable')}
            </p>
          )}
          <p class={styles.source}>{t('Rates as reported by your Home Assistant integration.')}</p>
        </div>
      )}
      <div class={styles.priceRow} data-price-status={tone}>
        <div class={styles.price}>
          <span class={styles.metricLabel}>{t('Current price')}</span>
          <strong data-testid="energy-buy">
            {online ? formatEnergyValue(reading.buy, locale) : '—'}
          </strong>
          {reading.currency && <span class={styles.unit}>{reading.currency} / kWh</span>}
        </div>
        <dl class={styles.usage}>
          <dt>{online && usage !== null && usage < 0 ? t('Grid export') : t('Current usage')}</dt>
          <dd data-testid="energy-usage">
            <strong>
              {online && usage !== null ? formatEnergyValue(Math.abs(usage), locale) : '—'}
            </strong>
            {online && usage !== null && (
              <>
                {' '}
                <span class={styles.unit}>kW</span>
              </>
            )}
          </dd>
        </dl>
      </div>
      {status && <p class={styles.note}>{status}</p>}
      <div class={styles.priceStatus}>{label}</div>
      {online && reading.todayMinimum !== null && reading.todayMaximum !== null && (
        <div class={styles.dailyRange} aria-label={t("Today's price range")}>
          <div class={styles.track}>
            {reading.position !== null && (
              <span class={styles.marker} style={{ left: `${reading.position * 100}%` }} />
            )}
          </div>
          <div class={styles.rangeLabels}>
            <span>
              {t('Low')} <b>{formatEnergyValue(reading.todayMinimum, locale)}</b>
            </span>
            <span>
              {t('High')} <b>{formatEnergyValue(reading.todayMaximum, locale)}</b>
            </span>
          </div>
        </div>
      )}
      <dl class={styles.metrics}>
        <div>
          <dt>{t('Next hour')}</dt>
          <dd>{online ? formatEnergyValue(reading.next, locale) : '—'}</dd>
        </div>
        <div>
          <dt>{t('Selling')}</dt>
          <dd>{online ? formatEnergyValue(reading.sell, locale) : '—'}</dd>
        </div>
      </dl>
    </Widget>
  );
}
