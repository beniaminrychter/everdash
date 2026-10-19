import { useI18n } from '../../../../shared/i18n/index';
import { createClimate } from '../../../climate/data/model';
import type { LiveClimate, ClimateChange } from '../../../climate/data/model';
import { ClimateCard } from '../../../climate/components/ClimateCard/ClimateCard';
import { groupCards } from '../../data/discovery';
import type { EntityReadings, ResolvedView } from '../../data/types';
import type { LiveDevice } from '../../../accessories/data/model';
import { AccessoryCard } from '../../../accessories/components/AccessoryCard/AccessoryCard';
import { EnergyCard } from '../../../energy/components/EnergyCard/EnergyCard';
import { WeatherCard } from '../../../weather/components/WeatherCard/WeatherCard';
import styles from './DashboardCards.module.css';

interface Props {
  view: ResolvedView;
  devices: readonly LiveDevice[];
  climates: readonly LiveClimate[];
  onClimateChange: (id: string, change: ClimateChange, debounceMs?: number) => void;
  readings: EntityReadings;
  forecasts: Readonly<Record<string, readonly unknown[]>>;
  online: boolean;
  now: number;
  timeZone?: string;
  onToggle: (id: string) => void;
  onDetails: (id: string) => void;
  readOnly?: boolean;
}
export function DashboardCards({
  view,
  devices,
  climates,
  onClimateChange,
  readings,
  forecasts,
  online,
  now,
  timeZone,
  onToggle,
  onDetails,
  readOnly = false,
}: Props) {
  const { t } = useI18n();
  const reading = (id: string | undefined) => (id ? readings[id] : undefined);
  return (
    <div class={styles.groups}>
      {groupCards(view.cards).map((group, groupIndex) =>
        group.type === 'accessories' ? (
          <section key={groupIndex} aria-label={t('Accessories')}>
            <div class={styles.accessoryGrid} data-testid="accessory-grid">
              {group.cards.map((card, cardIndex) => {
                const device = devices.find((candidate) => candidate.id === card.entity);
                if (!device) {
                  return null;
                }
                return (
                  <AccessoryCard
                    key={cardIndex}
                    device={{ ...device, icon: card.icon, name: card.name, room: view.title }}
                    disabled={!online || readOnly}
                    onToggle={onToggle}
                    onDetails={onDetails}
                  />
                );
              })}
            </div>
          </section>
        ) : (
          <div key={groupIndex} class={styles.widgetGrid}>
            {group.cards.map((card, cardIndex) => {
              const titleId = `widget-${encodeURIComponent(view.id)}-${groupIndex}-${cardIndex}`;
              return (
                <div
                  class={card.type === 'weather' ? styles.wide : undefined}
                  key={cardIndex}
                  data-card={card.type}
                  data-card-entity={card.entity}
                >
                  {card.type === 'pstryk' ? (
                    <EnergyCard
                      title={card.defaultTitle ? undefined : card.name}
                      titleId={titleId}
                      buyEntity={reading(card.entity)}
                      sellEntity={reading(card.sellPrice)}
                      nextEntity={reading(card.nextPrice)}
                      scheduleEntity={reading(card.schedule)}
                      usageEntity={reading(card.usage)}
                      online={online}
                      now={now}
                      timeZone={timeZone}
                    />
                  ) : card.type === 'climate' ? (
                    <ClimateCard
                      title={card.name}
                      titleId={titleId}
                      online={online}
                      disabled={readOnly}
                      climate={
                        climates.find((item) => item.entityId === card.entity) ||
                        createClimate({
                          entityId: card.entity,
                          name: card.name,
                          temperatureUnit: card.temperatureUnit || '°C',
                        })
                      }
                      onChange={(change, debounceMs) =>
                        onClimateChange(card.entity, change, debounceMs)
                      }
                    />
                  ) : (
                    <WeatherCard
                      title={card.defaultTitle ? undefined : card.name}
                      titleId={titleId}
                      entity={reading(card.entity)}
                      forecast={forecasts[card.entity]}
                      timeZone={timeZone}
                      online={online}
                      now={now}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ),
      )}
    </div>
  );
}
