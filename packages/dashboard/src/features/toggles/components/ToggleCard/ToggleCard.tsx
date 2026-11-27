import { useI18n } from '@everdash/ui/i18n/index';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import { defaultAccent, deviceTint } from '../../../../shared/color/tint';
import styles from './ToggleCard.module.css';

/** A toggle has no colour of its own, so it shares the default on-state accent with lights and switches. */
const toggleAccent = defaultAccent;

interface Props {
  name: string;
  icon: IconName;
  /** Translated state text, for example On, Off, Open or Unavailable. */
  status: string;
  on: boolean;
  /** Why the card cannot show a state, such as an unavailable entity. */
  problem?: boolean;
  /** Read-only cards (binary sensors) show a state but cannot be tapped. */
  readOnly?: boolean;
  disabled?: boolean;
  entityId: string;
  onToggle?: () => void;
}

export function ToggleCard({
  name,
  icon,
  status,
  on,
  problem = false,
  readOnly = false,
  disabled = false,
  entityId,
  onToggle,
}: Props) {
  const { t } = useI18n();
  const active = on && !problem;
  // Only tappable controls use the bright "on" tile; a read-only sensor just tints its icon and state.
  const stateClass = readOnly ? (active ? styles.isActive : '') : active ? styles.isOn : '';
  const className = `${styles.card} ${stateClass} ${problem ? styles.isUnavailable : ''}`;
  const tint = deviceTint(toggleAccent);
  const tintStyle = {
    '--device-color': tint.color,
    '--device-disc': tint.disc,
    '--device-ink-light': tint.inkLight,
    '--device-ink-dark': tint.inkDark,
  };
  const content = (
    <>
      <span class={styles.disc}>
        <Icon name={icon} className={styles.icon} />
      </span>
      <span class={styles.text}>
        <span class={styles.name}>{name}</span>
        <span class={styles.status} data-testid="toggle-status">
          {status}
        </span>
      </span>
    </>
  );

  if (readOnly) {
    return (
      <div
        class={className}
        style={tintStyle}
        role="switch"
        aria-checked={on && !problem}
        aria-readonly="true"
        aria-label={`${name}: ${status}`}
        data-toggle-card="readonly"
        data-toggle-entity={entityId}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      class={`${className} ${styles.control}`}
      style={tintStyle}
      role="switch"
      aria-checked={on}
      aria-label={t('{name} power', { name })}
      disabled={disabled || problem}
      onClick={onToggle}
      data-toggle-card="control"
      data-toggle-entity={entityId}
    >
      {content}
    </button>
  );
}
