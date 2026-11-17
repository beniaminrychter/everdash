import { useI18n, translateText } from '@everdash/ui/i18n/index';
import type { Device } from '@everdash/contracts/types/index';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import { BrightnessSlider } from '../BrightnessSlider/BrightnessSlider';
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
  const dimmable = device.dimmable !== false;
  const brightness = device.on ? (dimmable ? device.brightness : 100) : 0;
  const unavailable =
    disabled || Boolean(device.availability && device.availability !== 'available');
  const customColor = !swatches.some((swatch) => swatch.value === device.color);

  return (
    <>
      <output class={styles.level} id="brightness-value" for="brightness">
        {brightness > 0 ? `${brightness}%` : t('Off')}
      </output>
      <BrightnessSlider
        value={brightness}
        color={device.color}
        icon={device.icon as IconName}
        label={t('Brightness')}
        powerLabel={t('{name} power', { name: device.name })}
        on={device.on}
        disabled={unavailable}
        // A light that cannot dim is on or off: dragging past the bottom edge only toggles it.
        onChange={dimmable ? onBrightness : (value) => value > 0 !== device.on && onToggle()}
        onToggle={onToggle}
      />
      {device.colorCapable && (
        <div class={styles.colors}>
          {swatches.map((swatch) => (
            <button
              type="button"
              key={swatch.value}
              disabled={unavailable}
              class={styles.colorDot}
              style={{ '--swatch': swatch.value }}
              aria-label={translateText(swatch.name, t)}
              aria-pressed={device.color === swatch.value}
              onClick={() => onColor(swatch.value)}
            />
          ))}
          <label
            class={`${styles.colorDot} ${styles.customDot}`}
            style={{ '--swatch': device.color }}
            data-selected={customColor}
          >
            <span class={styles.customCurrent} />
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
      )}
    </>
  );
}
