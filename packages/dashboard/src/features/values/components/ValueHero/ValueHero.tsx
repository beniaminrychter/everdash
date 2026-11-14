import { useI18n } from '@everdash/ui/i18n/index';
import { Widget } from '@everdash/ui/ui/Widget/Widget';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import { describeStaleness } from '../../../dashboard/data/staleness';
import type { ValueReading } from '../../data/reading';
import styles from './ValueHero.module.css';

interface Props {
  name: string;
  titleId: string;
  icon: IconName;
  reading: ValueReading;
  entityId: string;
  /** ISO timestamp of the last state change, when Home Assistant provides it. */
  lastChanged?: string;
  now: number;
}

export function ValueHero({ name, titleId, icon, reading, entityId, lastChanged, now }: Props) {
  const { t } = useI18n();
  const problem = reading.status === 'unavailable' || reading.status === 'offline';
  const changed = lastChanged ? Date.parse(lastChanged) : Number.NaN;
  const age =
    reading.status === 'ready' && Number.isFinite(changed) ? describeStaleness(changed, now) : null;

  return (
    <div
      class={problem ? styles.isUnavailable : undefined}
      data-value-card="hero"
      data-value-entity={entityId}
    >
      <Widget title={name} titleId={titleId}>
        <div class={styles.body}>
          <Icon name={icon} className={styles.icon} />
          <div class={styles.reading} data-testid="value-reading">
            <strong>{reading.value}</strong>
            {reading.unit && <span class={styles.unit}>{reading.unit}</span>}
          </div>
        </div>
        {problem && (
          <p class={styles.status}>
            {reading.status === 'offline' ? t('Disconnected') : t('Unavailable')}
          </p>
        )}
        {age && <p class={styles.age}>{t(age.key, age.values)}</p>}
      </Widget>
    </div>
  );
}
