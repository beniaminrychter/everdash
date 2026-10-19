import { useI18n } from '../../../../shared/i18n';
import type { EntityReadings } from '../../../../shared/home-assistant/entities';
import type { LiveClimate } from '../../../climate/data/model';
import type { ResolvedView } from '../../../dashboard/data/types';
import type { LiveDevice } from '../../../accessories/data/model';
import styles from './ConnectedDataSources.module.css';

interface Props {
  view: ResolvedView;
  sunEntityId?: string;
  devices: readonly Pick<LiveDevice, 'id' | 'availability'>[];
  climates: readonly Pick<LiveClimate, 'entityId' | 'availability'>[];
  readings: EntityReadings;
}

export function ConnectedDataSources({ view, sunEntityId, devices, climates, readings }: Props) {
  const { t } = useI18n();
  const entityIds = new Set([
    ...view.badges.map((badge) => badge.entity),
    ...view.cards.flatMap((card) =>
      card.type === 'pstryk'
        ? [card.entity, card.sellPrice, card.nextPrice, card.usage, card.schedule].filter(
            (id): id is `sensor.${string}` => Boolean(id),
          )
        : [card.entity],
    ),
    ...(sunEntityId ? [sunEntityId] : []),
  ]);

  return (
    <details class={styles.sourceDetails}>
      <summary>{t('Connected data sources')}</summary>
      <ul>
        {[...entityIds].map((entityId) => (
          <li key={entityId}>
            <strong>{entityId}</strong>
            <span>
              {devices.some(
                (device) => device.id === entityId && device.availability === 'available',
              ) ||
              climates.some(
                (item) => item.entityId === entityId && item.availability === 'available',
              ) ||
              readings[entityId]
                ? t('Found')
                : t('Not found')}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
