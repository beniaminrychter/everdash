import { useI18n, translateText } from '../../../../shared/i18n/index';
import type { Device } from '../../../../shared/types/index';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import type { IconName } from '../../../../shared/ui/Icon/Icon';
import styles from './AccessoryCard.module.css';

interface AccessoryCardProps {
  device: Readonly<Device>;
  onToggle: (id: string) => void;
  onDetails: (id: string) => void;
  disabled?: boolean;
}
export function AccessoryCard({
  device,
  onToggle,
  onDetails,
  disabled = false,
}: AccessoryCardProps) {
  const { t } = useI18n();
  const isLight = device.type === 'light';
  const unavailable = Boolean(device.availability && device.availability !== 'available');
  const status = unavailable
    ? {
        available: '',
        error: 'Disconnected',
        loading: 'Loading…',
        missing: 'Entity not found',
        unavailable: 'Unavailable',
      }[device.availability!]
    : device.on
      ? isLight && device.dimmable !== false
        ? `${device.brightness}%`
        : 'On'
      : 'Off';
  const accent = device.colorCapable ? device.color : isLight ? '#ffd60a' : '#3489fa';
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(accent.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const ink = luminance > 0.179 ? '#18202b' : '#fff';
  return (
    <article
      class={`${styles.accessory} ${device.on && !unavailable ? styles.isOn : ''}`}
      data-device={device.id}
      style={{
        '--device-color': accent,
        '--device-ink': ink,
      }}
    >
      <button
        type="button"
        class={styles.iconButton}
        aria-label={t('{name} power', { name: device.name })}
        aria-pressed={device.on}
        onClick={() => onToggle(device.id)}
        disabled={disabled || unavailable}
      >
        <Icon name={device.icon as IconName} className={styles.icon} />
      </button>
      <button
        type="button"
        class={styles.accessoryLabel}
        aria-label={
          isLight
            ? t('Adjust {name}', { name: device.name })
            : `${device.name}: ${translateText(status, t)}`
        }
        onClick={() => (isLight ? onDetails(device.id) : onToggle(device.id))}
        disabled={disabled || unavailable}
      >
        <span class={styles.deviceName}>{device.name}</span>
        <span class={styles.deviceStatus} data-testid="device-status">
          {translateText(status, t)}
        </span>
      </button>
    </article>
  );
}
