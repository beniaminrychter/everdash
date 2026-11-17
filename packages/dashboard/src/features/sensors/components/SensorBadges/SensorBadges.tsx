import { useI18n } from '@everdash/ui/i18n/index';
import type { ResolvedView, EntityReadings } from '../../../dashboard/data/types';
import type { EditorHandler } from '../../../dashboard/data/editorEvent';
import type { EditorKit } from '../../../dashboard/data/editorKit';
import { sensorValue } from '../../data/readings';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import styles from './SensorBadges.module.css';

const ignoreEditorEvent: EditorHandler = () => undefined;

export function SensorBadges({
  badges,
  readings,
  online,
  editor,
  selectedIndex,
  onEditorEvent = ignoreEditorEvent,
}: {
  badges: ResolvedView['badges'];
  readings: EntityReadings;
  online: boolean;
  /** The editor's chrome; only the editor passes it, so the tablet bundles none of it. */
  editor?: EditorKit;
  /** Editor only: index of the badge to outline as selected. */
  selectedIndex?: number;
  onEditorEvent?: EditorHandler;
}) {
  const { t, locale } = useI18n();
  const items = badges.map((badge, index) => {
    const entity = readings[badge.entity];
    const value = sensorValue(online ? entity : undefined, locale);
    const key = `${badge.entity}#${badges.slice(0, index).filter((other) => other.entity === badge.entity).length}`;
    const pill = (
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
    );

    if (!editor) {
      return (
        <div class={styles.item} key={key}>
          {pill}
        </div>
      );
    }

    return (
      <editor.Badge
        key={key}
        index={index}
        count={badges.length}
        name={badge.name}
        selected={selectedIndex === index}
        class={styles.item}
        onEvent={onEditorEvent}
      >
        {pill}
      </editor.Badge>
    );
  });

  if (editor) {
    return (
      <editor.BadgeList class={styles.badges} onEvent={onEditorEvent}>
        {items}
      </editor.BadgeList>
    );
  }

  return (
    <div class={styles.badges} aria-label={t('Sensors')}>
      {items}
    </div>
  );
}
