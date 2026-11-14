import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { translateText, useI18n } from '@everdash/ui/i18n/index';
import { createClimate } from '../../../climate/data/model';
import type { LiveClimate, ClimateChange } from '../../../climate/data/model';
import { ClimateCard } from '../../../climate/components/ClimateCard/ClimateCard';
import { groupCards, isControlToggle } from '../../data/discovery';
import type {
  EntityReadings,
  ResolvedAccessory,
  ResolvedView,
  ResolvedWidget,
} from '../../data/types';
import type { LiveDevice } from '../../../accessories/data/model';
import { AccessoryCard } from '../../../accessories/components/AccessoryCard/AccessoryCard';
import { EnergyCard } from '../../../energy/components/EnergyCard/EnergyCard';
import { WeatherCard } from '../../../weather/components/WeatherCard/WeatherCard';
import { ValueTile } from '../../../values/components/ValueTile/ValueTile';
import { ValueCompact } from '../../../values/components/ValueCompact/ValueCompact';
import { ValueHero } from '../../../values/components/ValueHero/ValueHero';
import { readValue, valueIcon } from '../../../values/data/reading';
import { ToggleCard } from '../../../toggles/components/ToggleCard/ToggleCard';
import { controlStatus, sensorStatus, toggleIcon } from '../../../toggles/data/status';
import { SceneCard } from '../../../scenes/components/SceneCard/SceneCard';
import { sceneUnavailable } from '../../../scenes/data/availability';
import styles from './DashboardCards.module.css';

interface Props {
  view: ResolvedView;
  devices: readonly LiveDevice[];
  climates: readonly LiveClimate[];
  onClimateChange: (id: string, change: ClimateChange, debounceMs?: number) => void;
  readings: EntityReadings;
  forecasts: Readonly<Record<string, readonly unknown[]>>;
  online: boolean;
  /** False until the first readings arrive; cards then show a loading state. */
  ready?: boolean;
  now: number;
  timeZone?: string;
  onToggle: (id: string) => void;
  onDetails: (id: string) => void;
  /** Runs a scene or script; resolves when Home Assistant accepts the call. */
  onActivate?: (id: string) => Promise<void>;
  readOnly?: boolean;
  editorMode?: boolean;
  editorKeys?: readonly string[];
  /** Editor only: index of the card to outline as selected. */
  selectedIndex?: number;
  onEditorAction?: (action: 'edit' | 'delete' | 'move', index: number, offset?: number) => void;
}

type ActionIconName = 'delete' | 'grip' | 'up' | 'down' | 'left' | 'right';

const actionIconPaths: Record<ActionIconName, string> = {
  delete: 'M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 11v6m4-6v6',
  grip: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
  up: 'm6 14 6-6 6 6',
  down: 'm6 10 6 6 6-6',
  left: 'm14 6-6 6 6 6',
  right: 'm10 6 6 6-6 6',
};

function ActionIcon({ name }: { name: ActionIconName }) {
  return (
    <svg
      class={styles.actionIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={name === 'grip' ? '3' : '1.8'}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={actionIconPaths[name]} />
    </svg>
  );
}

type EditorAction = (action: 'edit' | 'delete' | 'move', index: number, offset?: number) => void;

/**
 * Editor only: the card plus a transparent layer over it. Clicking anywhere on the card selects it
 * for the inspector, because the card's own controls are inert in the editor.
 */
function EditorCard({
  index,
  name,
  selected,
  onAction,
  children,
}: {
  index: number;
  name: string;
  selected: boolean;
  onAction?: EditorAction;
  children: ComponentChildren;
}) {
  return (
    <div class={selected ? `${styles.editorCard} ${styles.selectedCard}` : styles.editorCard}>
      {children}
      <button
        type="button"
        class={styles.selectLayer}
        aria-label={`Edit ${name}`}
        aria-pressed={selected}
        title={`Edit ${name}`}
        onClick={() => onAction?.('edit', index)}
      />
    </div>
  );
}

function EditorFooter({
  index,
  count,
  name,
  horizontal,
  onAction,
}: {
  index: number;
  count: number;
  name: string;
  /** Cards in a grid move left and right; stacked widgets move up and down. */
  horizontal: boolean;
  onAction?: EditorAction;
}) {
  return (
    <fieldset class={styles.editorFooter} aria-label={`${name} card actions`}>
      <button
        type="button"
        class={styles.dragHandle}
        draggable
        aria-label={`Drag ${name} to reorder`}
        title="Drag to reorder"
        onDragStart={(event) => {
          event.dataTransfer?.setData('text/everdash-card', String(index));
        }}
      >
        <ActionIcon name="grip" />
      </button>
      <button
        type="button"
        onClick={() => onAction?.('move', index, -1)}
        disabled={index === 0}
        aria-label={`Move ${name} earlier`}
        title={horizontal ? 'Move left' : 'Move up'}
      >
        <ActionIcon name={horizontal ? 'left' : 'up'} />
      </button>
      <button
        type="button"
        onClick={() => onAction?.('move', index, 1)}
        disabled={index === count - 1}
        aria-label={`Move ${name} later`}
        title={horizontal ? 'Move right' : 'Move down'}
      >
        <ActionIcon name={horizontal ? 'right' : 'down'} />
      </button>
      <button
        type="button"
        class={styles.deleteAction}
        onClick={() => onAction?.('delete', index)}
        aria-label={`Delete ${name}`}
        title="Delete"
      >
        <ActionIcon name="delete" />
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
  ready = true,
  now,
  timeZone,
  onToggle,
  onDetails,
  onActivate,
  readOnly = false,
  editorMode = false,
  editorKeys,
  selectedIndex,
  onEditorAction,
}: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1024);
  useEffect(() => {
    const measure = () => setWidth(surface.current?.getBoundingClientRect().width ?? 1024);
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (surface.current) {
      observer?.observe(surface.current);
    }
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, []);
  const { t, locale } = useI18n();
  const reading = (id: string | undefined) => (id ? readings[id] : undefined);

  const renderAccessory = (card: ResolvedAccessory) => {
    const interactive = online && !(readOnly && !editorMode);
    switch (card.type) {
      case 'light':
      case 'outlet': {
        const device = devices.find((candidate) => candidate.id === card.entity);
        if (!device) {
          return null;
        }

        return (
          <AccessoryCard
            device={{ ...device, icon: card.icon, name: card.name, room: view.title }}
            disabled={!interactive}
            onToggle={editorMode ? () => undefined : onToggle}
            onDetails={editorMode ? () => undefined : onDetails}
          />
        );
      }

      case 'toggle': {
        if (isControlToggle(card.entity)) {
          const device = devices.find((candidate) => candidate.id === card.entity);
          if (!device) {
            return null;
          }

          const status = controlStatus(device);

          return (
            <ToggleCard
              name={card.name}
              icon={toggleIcon(card.icon, undefined)}
              entityId={card.entity}
              status={translateText(status.text, t)}
              on={status.on}
              problem={status.problem}
              disabled={!interactive}
              onToggle={editorMode ? undefined : () => onToggle(card.entity)}
            />
          );
        }

        const sensor = reading(card.entity);
        const status = sensorStatus(sensor, { online, ready }, locale);

        return (
          <ToggleCard
            name={card.name}
            icon={toggleIcon(card.icon, sensor)}
            entityId={card.entity}
            status={translateText(status.text, t)}
            on={status.on}
            problem={status.problem}
            readOnly
          />
        );
      }

      case 'scene': {
        const entity = reading(card.entity);

        return (
          <SceneCard
            name={card.name}
            icon={card.icon}
            entityId={card.entity}
            problem={sceneUnavailable(entity, ready)}
            disabled={!interactive || editorMode || !onActivate}
            onRun={(id) => onActivate?.(id) ?? Promise.reject(new Error('Unavailable'))}
          />
        );
      }

      case 'value': {
        const entity = reading(card.entity);
        const value = readValue(entity, card, { online, ready }, locale);
        const icon = valueIcon(card.icon, entity);

        return card.template === 'compact' ? (
          <ValueCompact name={card.name} icon={icon} reading={value} entityId={card.entity} />
        ) : (
          <ValueTile name={card.name} icon={icon} reading={value} entityId={card.entity} />
        );
      }

      default: {
        const unsupported: never = card;

        return unsupported;
      }
    }
  };

  const renderWidget = (card: ResolvedWidget, titleId: string) => {
    switch (card.type) {
      case 'pstryk': {
        return (
          <EnergyCard
            title={card.defaultTitle ? undefined : card.name}
            titleId={titleId}
            buyEntity={reading(card.entity)}
            sellEntity={reading(card.sellPrice)}
            nextEntity={reading(card.nextPrice)}
            scheduleEntity={reading(card.schedule)}
            usageEntity={reading(card.usage)}
            online={online}
            loading={!ready}
            now={now}
            timeZone={timeZone}
          />
        );
      }

      case 'climate': {
        return (
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
        );
      }

      case 'weather': {
        return (
          <WeatherCard
            title={card.defaultTitle ? undefined : card.name}
            titleId={titleId}
            entity={reading(card.entity)}
            forecast={forecasts[card.entity]}
            timeZone={timeZone}
            online={online}
            now={now}
          />
        );
      }

      case 'value': {
        const entity = reading(card.entity);

        return (
          <ValueHero
            name={card.name}
            titleId={titleId}
            icon={valueIcon(card.icon, entity)}
            reading={readValue(entity, card, { online, ready }, locale)}
            entityId={card.entity}
            lastChanged={entity?.last_changed}
            now={now}
          />
        );
      }

      default: {
        const unsupported: never = card;

        return unsupported;
      }
    }
  };

  return (
    <div
      ref={surface}
      class={styles.groups}
      onDragOver={(event) => {
        if (editorMode) {
          event.preventDefault();
        }
      }}
      onDrop={(event) => {
        if (!editorMode) {
          return;
        }
        event.preventDefault();
        const raw = event.dataTransfer?.getData('text/everdash-card') ?? '';
        const element =
          event.target instanceof Element
            ? event.target.closest<HTMLElement>('[data-editor-index]')
            : null;
        const target = element?.dataset.editorIndex;
        if (!/^\d+$/.test(raw) || target === null || target === undefined) {
          return;
        }
        const source = Number(raw);
        const destination = Number(target);
        if (
          source < view.cards.length &&
          destination < view.cards.length &&
          source !== destination
        ) {
          onEditorAction?.('move', source, destination - source);
        }
      }}
    >
      {view.cards.length === 0 && !editorMode && (
        <p class={styles.emptyView} data-testid="empty-view">
          {t('No cards in this view yet')}
        </p>
      )}
      {groupCards(view.cards).map((group, groupIndex) =>
        group.type === 'accessories' ? (
          <section key={groupIndex} aria-label={t('Accessories')}>
            <div
              class={styles.accessoryGrid}
              style={
                editorMode
                  ? {
                      gridTemplateColumns: `repeat(${width <= 699 ? 2 : width <= 899 ? 3 : 4}, minmax(0, 1fr))`,
                    }
                  : undefined
              }
              data-testid="accessory-grid"
            >
              {group.cards.map((card, cardIndex) => {
                const content = renderAccessory(card);
                const index = view.cards.indexOf(card);
                const selected = editorMode && selectedIndex === index;
                if (!content) {
                  return null;
                }
                const compact = card.type === 'value' && card.template === 'compact';
                const classes = [
                  editorMode ? styles.editorItem : '',
                  compact ? styles.compactItem : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <div
                    class={classes || undefined}
                    key={editorKeys?.[index] ?? cardIndex}
                    data-editor-index={index}
                  >
                    {editorMode ? (
                      <>
                        <EditorCard
                          index={index}
                          name={card.name}
                          selected={selected}
                          onAction={onEditorAction}
                        >
                          {content}
                        </EditorCard>
                        <EditorFooter
                          index={index}
                          count={view.cards.length}
                          name={card.name}
                          horizontal
                          onAction={onEditorAction}
                        />
                      </>
                    ) : (
                      content
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div
            key={groupIndex}
            class={styles.widgetGrid}
            style={
              editorMode
                ? {
                    gridTemplateColumns:
                      width <= 699 ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
                  }
                : undefined
            }
          >
            {group.cards.map((card, cardIndex) => {
              const titleId = `widget-${encodeURIComponent(view.id)}-${groupIndex}-${cardIndex}`;
              const index = view.cards.indexOf(card);
              const selected = editorMode && selectedIndex === index;
              return (
                <div
                  class={[
                    card.type === 'weather' || card.type === 'value' ? styles.wide : '',
                    editorMode ? styles.editorItem : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={editorKeys?.[index] ?? cardIndex}
                  data-editor-index={index}
                  data-card={card.type}
                  data-card-entity={card.entity}
                >
                  {editorMode ? (
                    <>
                      <EditorCard
                        index={index}
                        name={card.name}
                        selected={selected}
                        onAction={onEditorAction}
                      >
                        {renderWidget(card, titleId)}
                      </EditorCard>
                      <EditorFooter
                        index={index}
                        count={view.cards.length}
                        name={card.name}
                        horizontal={false}
                        onAction={onEditorAction}
                      />
                    </>
                  ) : (
                    renderWidget(card, titleId)
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
