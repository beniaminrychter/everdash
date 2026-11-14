import { useI18n } from '@everdash/ui/i18n/index';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import type { ValueReading } from '../../data/reading';
import styles from './ValueCompact.module.css';

interface Props {
  name: string;
  icon: IconName;
  reading: ValueReading;
  entityId: string;
}

export function ValueCompact({ name, icon, reading, entityId }: Props) {
  const { t } = useI18n();
  const problem = reading.status === 'unavailable' || reading.status === 'offline';

  return (
    <article
      class={`${styles.row} ${problem ? styles.isUnavailable : ''}`}
      data-value-card="compact"
      data-value-entity={entityId}
    >
      <Icon name={icon} className={styles.icon} />
      <span class={styles.name}>{name}</span>
      <span class={styles.reading} data-testid="value-reading">
        {problem ? (
          <span class={styles.status}>
            {reading.status === 'offline' ? t('Disconnected') : t('Unavailable')}
          </span>
        ) : (
          <>
            <strong>{reading.value}</strong>
            {reading.unit && <span class={styles.unit}>{reading.unit}</span>}
          </>
        )}
      </span>
    </article>
  );
}
