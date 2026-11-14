import { useI18n } from '@everdash/ui/i18n/index';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import type { ValueReading } from '../../data/reading';
import styles from './ValueTile.module.css';

interface Props {
  name: string;
  icon: IconName;
  reading: ValueReading;
  entityId: string;
}

export function ValueTile({ name, icon, reading, entityId }: Props) {
  const { t } = useI18n();
  const problem = reading.status === 'unavailable' || reading.status === 'offline';

  return (
    <article
      class={`${styles.tile} ${problem ? styles.isUnavailable : ''}`}
      data-value-card="tile"
      data-value-entity={entityId}
    >
      <span class={styles.disc}>
        <Icon name={icon} className={styles.icon} />
      </span>
      <div class={styles.text}>
        <span class={styles.name}>{name}</span>
        <span class={styles.reading} data-testid="value-reading">
          <strong>{reading.value}</strong>
          {reading.unit && <span class={styles.unit}>{reading.unit}</span>}
        </span>
        {problem && (
          <span class={styles.status}>
            {reading.status === 'offline' ? t('Disconnected') : t('Unavailable')}
          </span>
        )}
      </div>
    </article>
  );
}
