import { useState } from 'preact/hooks';
import type { EnergyReading } from '../data/readings';
import { useI18n } from '../../../shared/i18n/index';
import { formatEnergyValue } from '../data/format';
import styles from './PriceChart.module.css';

const hour = (time: number, locale: string, timeZone?: string) =>
  new Date(time).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
interface ChartProps {
  reading: EnergyReading;
  now: number;
  timeZone?: string;
}

export function PriceChart({ reading, now, timeZone }: ChartProps) {
  const { t, locale } = useI18n();
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const { slots } = reading;
  const firstSlot = slots[0];
  const lastSlot = slots[slots.length - 1];
  const selected = slots.find((slot) => slot.time === selectedTime);
  const low = Math.min(0, reading.minimum ?? 0);
  const high = Math.max(0, reading.maximum ?? 0);
  const range = high - low || 1;
  const y = (value: number) => 8 + ((high - value) / range) * 80;
  const priceLabel = (time: number, price: number) =>
    t('{time}: {price} {currency}/kWh', {
      currency: reading.currency || '',
      price: formatEnergyValue(price, locale),
      time: new Date(time).toLocaleString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone,
      }),
    });
  if (!firstSlot || !lastSlot) {
    return null;
  }
  return (
    <>
      <div class={styles.chartHeading}>
        <span>{t('Published prices')}</span>
        <span>{reading.currency} / kWh</span>
      </div>
      <p
        class={styles.selectedPrice}
        data-testid="energy-selected-price"
        aria-live="polite"
        aria-atomic="true"
      >
        {selected ? priceLabel(selected.time, selected.price) : t('Select a bar to see its price.')}
      </p>
      <div class={styles.chartScroll}>
        <div class={styles.chartCanvas} style={{ minWidth: `${slots.length * 24}px` }}>
          <div class={styles.chart} role="group" aria-label={t('Published prices')}>
            {slots.map((slot) => (
              <button
                type="button"
                key={slot.time}
                class={styles.bar}
                data-testid="energy-price-bar"
                data-time={slot.time}
                data-price={slot.price}
                data-current={slot.time <= now && slot.end > now}
                data-lowest={reading.cheapest?.time === slot.time}
                aria-label={priceLabel(slot.time, slot.price)}
                aria-pressed={selectedTime === slot.time}
                onClick={() => setSelectedTime(slot.time)}
              >
                <svg viewBox="0 0 24 100" preserveAspectRatio="none" aria-hidden="true">
                  <line x1="0" x2="24" y1={y(0)} y2={y(0)} />
                  <rect
                    x="3"
                    y={Math.min(y(0), y(slot.price))}
                    width="18"
                    height={Math.max(1, Math.abs(y(slot.price) - y(0)))}
                    rx="2"
                  />
                </svg>
              </button>
            ))}
          </div>
          <div class={styles.axis} data-testid="energy-chart-axis">
            <span>{hour(firstSlot.time, locale, timeZone)}</span>
            <span>{t('Now {time}', { time: hour(now, locale, timeZone) })}</span>
            <span>{hour(lastSlot.end, locale, timeZone)}</span>
          </div>
        </div>
      </div>
      {reading.cheapest && (
        <p class={styles.cheapest}>
          {t('Lowest upcoming · {price} {currency}/kWh · {time}', {
            currency: reading.currency || '',
            price: formatEnergyValue(reading.cheapest.price, locale),
            time:
              reading.cheapest.time <= now
                ? t('now')
                : new Date(reading.cheapest.time).toLocaleString(locale, {
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone,
                  }),
          })}
        </p>
      )}
    </>
  );
}
