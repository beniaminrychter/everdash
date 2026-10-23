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
  editorMode?: boolean;
  onEditorAction?: (action: 'edit' | 'delete' | 'move', index: number, offset?: -1 | 1) => void;
}

function ActionIcon({ name }: { name: 'edit' | 'delete' | 'up' | 'down' }) {
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
      ) : name === 'delete' ? (
        <>
          <path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6" />
          <path d="M10 11v6m4-6v6" />
        </>
      ) : name === 'up' ? (
        <path d="m6 14 6-6 6 6" />
      ) : (
        <path d="m6 10 6 6 6-6" />
      )}
    </svg>
  );
}

function EditorFooter({
  index,
  count,
  name,
  onAction,
}: {
  index: number;
  count: number;
  name: string;
  onAction?: (action: 'edit' | 'delete' | 'move', index: number, offset?: -1 | 1) => void;
}) {
  return (
    <fieldset class={styles.editorFooter} aria-label={`${name} card actions`}>
      <button type="button" onClick={() => onAction?.('edit', index)} aria-label={`Edit ${name}`}>
        <ActionIcon name="edit" /> Edit
      </button>
      <button
        type="button"
        class={styles.deleteAction}
        onClick={() => onAction?.('delete', index)}
        aria-label={`Delete ${name}`}
      >
        <ActionIcon name="delete" /> Delete
      </button>
      <button
        type="button"
        onClick={() => onAction?.('move', index, -1)}
        disabled={index === 0}
        aria-label={`Move ${name} earlier`}
      >
        <ActionIcon name="up" />
      </button>
      <button
        type="button"
        onClick={() => onAction?.('move', index, 1)}
        disabled={index === count - 1}
        aria-label={`Move ${name} later`}
      >
        <ActionIcon name="down" />
      </button>
    </fieldset>
  );
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
  editorMode = false,
  onEditorAction,
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
                const index = view.cards.indexOf(card);
                if (!device) {
                  return null;
                }
                return (
                  <div class={editorMode ? styles.editorItem : undefined} key={cardIndex}>
                    <AccessoryCard
                      device={{ ...device, icon: card.icon, name: card.name, room: view.title }}
                      disabled={!online || (readOnly && !editorMode)}
                      onToggle={editorMode ? () => undefined : onToggle}
                      onDetails={editorMode ? () => undefined : onDetails}
                    />
                    {editorMode && (
                      <EditorFooter
                        index={index}
                        count={view.cards.length}
                        name={card.name}
                        onAction={onEditorAction}
                      />
                    )}
                  </div>
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
                  class={`${card.type === 'weather' ? styles.wide : ''} ${editorMode ? styles.editorItem : ''}`}
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
                      disabled={readOnly && !editorMode}
                      climate={
                        climates.find((item) => item.entityId === card.entity) ||
                        createClimate({
                          entityId: card.entity,
                          name: card.name,
                          temperatureUnit: card.temperatureUnit || '°C',
                        })
                      }
                      onChange={(change, debounceMs) => {
                        if (!editorMode) {
                          onClimateChange(card.entity, change, debounceMs);
                        }
                      }}
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
                  {editorMode && (
                    <EditorFooter
                      index={view.cards.indexOf(card)}
                      count={view.cards.length}
                      name={card.name}
                      onAction={onEditorAction}
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
