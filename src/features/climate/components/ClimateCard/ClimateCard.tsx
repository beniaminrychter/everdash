import { useI18n, translateText } from '../../../../shared/i18n/index';
import { stepTemperature } from '../../data/model';
import type { ClimateChange, LiveClimate } from '../../data/model';
import { formatTemperature } from '../../../../shared/dashboard/readings';
import { Widget } from '../../../../shared/ui/Widget/Widget';
import styles from './ClimateCard.module.css';

interface Props {
  climate: LiveClimate;
  title: string;
  titleId: string;
  online: boolean;
  onChange: (change: ClimateChange, debounceMs?: number) => void;
}
const modes = [
  { label: 'Off', value: 'off' },
  { label: 'Cool', value: 'cool' },
  { label: 'Heat', value: 'heat' },
  { label: 'Dry', value: 'dry' },
];
export function ClimateCard({ climate, title, titleId, online, onChange }: Props) {
  const { t, locale } = useI18n();
  const available = online && climate.availability === 'available';
  const off = climate.hvacMode === 'off';
  const controlsEnabled = available && !off;
  const lower = stepTemperature(climate, -1);
  const higher = stepTemperature(climate, 1);
  const middle =
    ['medium', 'mid', 'middle'].find((value) => climate.fanModes.includes(value)) || 'medium';
  const fans = [
    { label: 'Auto', value: 'auto' },
    { label: 'Low', value: 'low' },
    { label: 'Mid', value: middle },
    { label: 'High', value: 'high' },
  ];
  const status = online
    ? climate.availability === 'loading'
      ? 'Loading…'
      : climate.availability === 'missing'
        ? 'Entity not found'
        : !available
          ? 'Unavailable'
          : ''
    : 'Offline';
  return (
    <Widget title={title} titleId={titleId}>
      <div class={styles.setpoint}>
        <button
          type="button"
          class={styles.step}
          aria-label={t('Decrease {name} temperature', { name: title })}
          disabled={!controlsEnabled || lower === null || lower === climate.temperature}
          onClick={() => lower !== null && onChange({ temperature: lower }, 250)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
        <div class={`${styles.target} ${off ? styles.targetOff : ''}`}>
          <output
            aria-label={t('{name} set temperature', { name: title })}
            data-testid="climate-temperature"
          >
            {available && climate.temperature !== null
              ? `${formatTemperature(climate.temperature, locale)}${climate.temperatureUnit}`
              : '—'}
          </output>
        </div>
        <button
          type="button"
          class={styles.step}
          aria-label={t('Increase {name} temperature', { name: title })}
          disabled={!controlsEnabled || higher === null || higher === climate.temperature}
          onClick={() => higher !== null && onChange({ temperature: higher }, 250)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M12 5v14" />
          </svg>
        </button>
      </div>
      <fieldset class={styles.options}>
        <legend>{t('Mode')}</legend>
        <div class={styles.buttons}>
          {modes.map((mode) => (
            <button
              type="button"
              key={mode.value}
              aria-pressed={available && climate.hvacMode === mode.value}
              disabled={!available || !climate.hvacModes.includes(mode.value)}
              onClick={() => onChange({ hvacMode: mode.value })}
            >
              {translateText(mode.label, t)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset class={styles.options}>
        <legend>{t('Fan')}</legend>
        <div class={styles.buttons}>
          {fans.map((fan) => (
            <button
              type="button"
              key={fan.value}
              aria-pressed={available && climate.fanMode === fan.value}
              disabled={!controlsEnabled || !climate.fanModes.includes(fan.value)}
              onClick={() => onChange({ fanMode: fan.value })}
            >
              {translateText(fan.label, t)}
            </button>
          ))}
        </div>
      </fieldset>
      {status && <p class={styles.status}>{translateText(status, t)}</p>}
    </Widget>
  );
}
