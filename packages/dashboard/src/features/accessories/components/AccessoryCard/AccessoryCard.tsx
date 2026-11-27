import { useI18n, translateText } from '@everdash/ui/i18n/index';
import type { Device } from '@everdash/contracts/types/index';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import { deviceTint } from '../../../../shared/color/tint';
import { deviceAccent } from '../../data/model';
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
  const tint = deviceTint(deviceAccent(device));

  return (
    <article
      class={`${styles.accessory} ${device.on && !unavailable ? styles.isOn : ''} ${unavailable ? styles.isUnavailable : ''}`}
      data-device={device.id}
      style={{
        '--device-color': tint.color,
        '--device-disc': tint.disc,
        '--device-ink-light': tint.inkLight,
        '--device-ink-dark': tint.inkDark,
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
