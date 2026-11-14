import { useI18n } from '@everdash/ui/i18n/index';
import type { ResolvedView, EntityReadings } from '../../../dashboard/data/types';
import { sensorValue } from '../../data/readings';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import styles from './SensorBadges.module.css';

function BadgeActionIcon({ name }: { name: 'edit' | 'delete' }) {
  return (
    <svg
      class={styles.actionIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {name === 'edit' ? (
        <>
          <path d="M12 20h9" />
          <path d="m16.5 3.5 4 4L8 20H4v-4z" />
        </>
      ) : (
        <>
          <path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6" />
          <path d="M10 11v6m4-6v6" />
        </>
      )}
    </svg>
  );
}

export function SensorBadges({
  badges,
  readings,
  online,
  editorMode = false,
  selectedIndex,
  onEdit,
  onDelete,
}: {
  badges: ResolvedView['badges'];
  readings: EntityReadings;
  online: boolean;
  editorMode?: boolean;
  /** Editor only: index of the badge to outline as selected. */
  selectedIndex?: number;
  onEdit?: (index: number) => void;
  onDelete?: (index: number) => void;
}) {
  const { t, locale } = useI18n();
  return (
    <div class={styles.badges} aria-label={t('Sensors')}>
      {badges.map((badge, index) => {
        const entity = readings[badge.entity];
        const value = sensorValue(online ? entity : undefined, locale);
        return (
          <div
            class={
              editorMode && selectedIndex === index
                ? `${styles.item} ${styles.selectedItem}`
                : styles.item
            }
            key={`${badge.entity}#${badges.slice(0, index).filter((other) => other.entity === badge.entity).length}`}
          >
            <div
              class={styles.badge}
              data-sensor={badge.entity}
              aria-label={t('{name}: {value}', {
                name: badge.name,
                value: value.available ? value.value + value.unit : t('Unavailable'),
              })}
            >
              <Icon name={badge.icon} className={styles.icon} />
              <span>{badge.name}</span>
              <strong>{value.available ? `${value.value}${value.unit}` : '—'}</strong>
            </div>
            {editorMode && (
              <fieldset class={styles.editorActions} aria-label={`${badge.name} badge actions`}>
                <button
                  type="button"
                  onClick={() => onEdit?.(index)}
                  aria-label={`Edit ${badge.name}`}
                >
                  <BadgeActionIcon name="edit" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(index)}
                  aria-label={`Delete ${badge.name}`}
                >
                  <BadgeActionIcon name="delete" /> Delete
                </button>
              </fieldset>
            )}
          </div>
        );
      })}
    </div>
  );
}
