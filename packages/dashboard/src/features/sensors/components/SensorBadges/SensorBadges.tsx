import { useI18n } from '@everdash/ui/i18n/index';
import type { ResolvedView, EntityReadings } from '../../../dashboard/data/types';
import { sensorValue } from '../../data/readings';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import styles from './SensorBadges.module.css';

/** The delete (trash) icon in the editor's badge actions. */
function BadgeActionIcon() {
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
      <path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 11v6m4-6v6" />
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
              {editorMode && (
                // Covers the badge, so a click anywhere on it opens the badge in the inspector.
                <button
                  type="button"
                  class={styles.selectLayer}
                  onClick={() => onEdit?.(index)}
                  aria-label={`Edit ${badge.name}`}
                  aria-pressed={selectedIndex === index}
                  title={`Edit ${badge.name}`}
                />
              )}
            </div>
            {editorMode && (
              <fieldset class={styles.editorActions} aria-label={`${badge.name} badge actions`}>
                <button
                  type="button"
                  onClick={() => onDelete?.(index)}
                  aria-label={`Delete ${badge.name}`}
                  title="Delete"
                >
                  <BadgeActionIcon />
                </button>
              </fieldset>
            )}
          </div>
        );
      })}
    </div>
  );
}
