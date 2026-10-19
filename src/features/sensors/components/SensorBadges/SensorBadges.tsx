import { useI18n } from '../../../../shared/i18n/index';
import type { ResolvedView, EntityReadings } from '../../../dashboard/data/types';
import { sensorValue } from '../../data/readings';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import styles from './SensorBadges.module.css';

export function SensorBadges({
  badges,
  readings,
  online,
}: {
  badges: ResolvedView['badges'];
  readings: EntityReadings;
  online: boolean;
}) {
  const { t, locale } = useI18n();
  return (
    <div class={styles.badges} aria-label={t('Room temperatures')}>
      {badges.map((badge) => {
        const entity = readings[badge.entity];
        const value = sensorValue(online ? entity : undefined, locale);
        return (
          <div
            class={styles.badge}
            key={badge.entity + badge.name}
            data-sensor={badge.entity}
            aria-label={t('{name} temperature: {value}', {
              name: badge.name,
              value: value.available ? value.value + value.unit : t('Unavailable'),
            })}
          >
            <Icon name={badge.icon} className={styles.icon} />
            <span>{badge.name}</span>
            <strong>{value.available ? `${value.value}${value.unit}` : '—'}</strong>
          </div>
        );
      })}
    </div>
  );
}
