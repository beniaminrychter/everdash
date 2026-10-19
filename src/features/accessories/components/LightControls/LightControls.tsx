import { useI18n, translateText } from '../../../../shared/i18n/index';
import type { Device } from '../../../../shared/types/index';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import type { IconName } from '../../../../shared/ui/Icon/Icon';
import { PowerToggle } from '../PowerToggle/PowerToggle';
import styles from './LightControls.module.css';

const swatches = [
  { name: 'Warm white', value: '#ffb33f' },
  { name: 'Soft white', value: '#f4e9cf' },
  { name: 'Coral', value: '#ff7c79' },
  { name: 'Lavender', value: '#a17af5' },
  { name: 'Ocean', value: '#5aaff5' },
  { name: 'Mint', value: '#62dcb1' },
];

interface LightControlsProps {
  device: Readonly<Device>;
  onToggle: () => void;
  onBrightness: (value: number) => void;
  onColor: (value: string) => void;
  disabled?: boolean;
}

export function LightControls({
  device,
  onToggle,
  onBrightness,
  onColor,
  disabled = false,
}: LightControlsProps) {
  const { t } = useI18n();
  const brightness = device.on ? device.brightness : 0;
  const unavailable =
    disabled || Boolean(device.availability && device.availability !== 'available');
  return (
    <>
      <div class={styles.lightPreview} style={{ color: device.color }}>
        <Icon name={device.icon as IconName} className={styles.icon} />
      </div>
      <div class={styles.sheetPower}>
        <span>{t('Power')}</span>
        <PowerToggle
          id="sheet-power"
          on={device.on}
          label={t('{name} power', { name: device.name })}
          onToggle={onToggle}
          disabled={unavailable}
          className={styles.powerToggle}
        />
      </div>
      {device.dimmable !== false && (
        <>
          <label class={styles.brightnessLabel} for="brightness">
            {t('Brightness')}
            <output id="brightness-value" for="brightness">
              {brightness}%
            </output>
          </label>
          <input
            class={styles.brightnessSlider}
            id="brightness"
            type="range"
            disabled={unavailable}
            aria-label={t('Brightness')}
            min="0"
            max="100"
            step="1"
            value={brightness}
            style={{ '--brightness': `${brightness}%` }}
            onInput={(event) => onBrightness(Number(event.currentTarget.value))}
          />
        </>
      )}
      {device.colorCapable && (
        <>
          <div class={styles.colorHeading}>
            <span>{t('Color')}</span>
            <label class={styles.customColorLabel}>
              {t('Custom')}
              <input
                class={styles.customColor}
                id="custom-color"
                type="color"
                disabled={unavailable}
                value={device.color}
                aria-label={t('Custom light color')}
                onInput={(event) => onColor(event.currentTarget.value)}
              />
            </label>
          </div>
          <div class={styles.colorSwatches}>
            {swatches.map((swatch) => (
              <button
                type="button"
                key={swatch.value}
                disabled={unavailable}
                class={styles.colorSwatch}
                style={{ '--swatch': swatch.value }}
                aria-label={translateText(swatch.name, t)}
                aria-pressed={device.color === swatch.value}
                onClick={() => onColor(swatch.value)}
              >
                <Icon name="check" className={styles.icon} />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
