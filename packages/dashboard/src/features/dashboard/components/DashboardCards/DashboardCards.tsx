import { useRef } from 'preact/hooks';
import { defaultCardRows } from '@everdash/contracts/config/cardRows';
import { defaultForecastType, forecastKey } from '@everdash/contracts/config/weatherForecast';
import { translateText, useI18n } from '@everdash/ui/i18n/index';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { createClimate } from '../../../climate/data/model';
import type { LiveClimate, ClimateChange } from '../../../climate/data/model';
import { ClimateCard } from '../../../climate/components/ClimateCard/ClimateCard';
import { isControlToggle, isWidget } from '../../data/discovery';
import type { CardLocation, EditorHandler } from '../../data/editorEvent';
import type { EditorKit } from '../../data/editorKit';
import { cardSpan, effectiveSize, widgetSize } from '../../data/gridLayout';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import { usePackedGrids } from '../../hooks/usePackedGrids';
import type {
  EntityReadings,
  ResolvedAccessory,
  ResolvedCard,
  ResolvedView,
  ResolvedWidget,
} from '../../data/types';
import type { LiveDevice } from '../../../accessories/data/model';
import { AccessoryCard } from '../../../accessories/components/AccessoryCard/AccessoryCard';
import { EnergyCard } from '../../../energy/components/EnergyCard/EnergyCard';
import { WeatherCard } from '../../../weather/components/WeatherCard/WeatherCard';
import { ClockCard } from '../../../clock/components/ClockCard/ClockCard';
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
  /** Editor only: the chrome around the cards. The tablet never passes it, so it never loads it. */
  editor?: EditorKit;
  /** Editor only: stable keys for the cards of the unsectioned area or of a section, by its id. */
  editorKeys?: (section: string | null) => readonly string[] | undefined;
  /** Editor only: the card to outline as selected. */
  selectedCard?: CardLocation;
  /** Editor only: the id of the section to outline as selected. */
  selectedSection?: string;
  /** Editor only: new cards that still need an entity. */
  incompleteCards?: readonly CardLocation[];
  onEditorEvent?: EditorHandler;
}

/** The tablet has no editor to report to. */
function noEvent() {
  // Nothing listens.
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
  editor,
  editorKeys,
  selectedCard,
  selectedSection,
  incompleteCards,
  onEditorEvent,
}: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(surface);

  usePackedGrids(surface, styles.cards);

  const { t, locale, language } = useI18n();
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
            forecast={forecasts[forecastKey(card.entity, card.forecast ?? defaultForecastType)]}
            dailyForecast={forecasts[forecastKey(card.entity, 'daily')]}
            forecastType={card.forecast ?? defaultForecastType}
            timeZone={timeZone}
            online={online}
            now={now}
            size={effectiveSize(widgetSize(card), width)}
            rows={card.rows ?? defaultCardRows}
          />
        );
      }

      case 'clock': {
        return (
          <ClockCard
            title={card.defaultTitle ? undefined : card.name}
            titleId={titleId}
            display={card.display ?? 'datetime'}
            size={effectiveSize(widgetSize(card), width)}
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

  /** The cards of one area: a single grid whose children are exactly its cards, in data order. */
  const renderCards = (section: string | null, cards: readonly ResolvedCard[]) => {
    const keys = editorKeys?.(section);
    const prefix = section === null ? 'cards' : `section-${section}`;
    const sections = view.sections.map((item) => ({ id: item.id, title: item.title }));

    return cards.map((card, index) => {
      const titleId = `widget-${encodeURIComponent(view.id)}-${prefix}-${index}`;
      const widget = isWidget(card);
      const content = widget ? renderWidget(card, titleId) : renderAccessory(card);
      const compact = card.type === 'value' && card.template === 'compact';
      const key = keys?.[index] ?? `${prefix}-${index}`;
      const style = { gridColumn: `span ${cardSpan(card, width)}` };
      const classes = compact ? styles.compactItem : undefined;
      const dataset = widget
        ? {
            'data-card': card.type,
            'data-card-entity': card.type === 'clock' ? undefined : card.entity,
          }
        : undefined;

      if (editor && editorMode) {
        const Card = editor.Card;

        return (
          <Card
            key={key}
            section={section}
            index={index}
            count={cards.length}
            name={card.name}
            type={card.type}
            selected={
              selectedCard !== undefined &&
              selectedCard.section === section &&
              selectedCard.index === index
            }
            incomplete={(incompleteCards ?? []).some(
              (item) => item.section === section && item.index === index,
            )}
            sections={sections}
            class={classes}
            style={style}
            dataset={dataset}
            onEvent={onEditorEvent ?? noEvent}
          >
            {content}
          </Card>
        );
      }

      // A card that cannot be drawn (its device has not arrived) leaves no gap in the grid.
      if (!content) {
        return null;
      }

      return (
        <div key={key} class={classes} style={style} {...dataset}>
          {content}
        </div>
      );
    });
  };

  /** One area's cards in a grid. In the editor the grid is sortable and, when empty, a drop zone. */
  const renderArea = (
    section: string | null,
    cards: readonly ResolvedCard[],
    emptyLabel: string,
  ) => {
    if (editor && editorMode) {
      const CardList = editor.CardList;

      return (
        <CardList
          section={section}
          class={styles.cards}
          empty={cards.length === 0}
          emptyLabel={emptyLabel}
          onEvent={onEditorEvent ?? noEvent}
        >
          {renderCards(section, cards)}
        </CardList>
      );
    }

    if (cards.length === 0) {
      return null;
    }

    return <div class={styles.cards}>{renderCards(section, cards)}</div>;
  };

  const hasSections = view.sections.length > 0;
  const total = view.sections.reduce(
    (sum, section) => sum + section.cards.length,
    view.cards.length,
  );
  const editing = editor !== undefined && editorMode;
  // Outside the editor an empty area draws nothing, so a view without cards or sections reads as empty.
  const showRoot = editing ? hasSections || view.cards.length > 0 : view.cards.length > 0;

  const renderSections = () =>
    view.sections.map((section, position) => {
      if (!editorMode && section.cards.length === 0) {
        return null;
      }

      const headingId = `section-${encodeURIComponent(view.id)}-${encodeURIComponent(section.id)}`;

      return (
        <section
          key={section.id}
          class={styles.section}
          aria-labelledby={headingId}
          data-editor-section={editing ? section.id : undefined}
        >
          {editing ? (
            <editor.SectionHeading
              id={section.id}
              headingId={headingId}
              headingClass={styles.sectionTitle}
              title={section.title}
              selected={selectedSection === section.id}
              position={position}
              count={view.sections.length}
              onEvent={onEditorEvent ?? noEvent}
            />
          ) : (
            <h2 class={styles.sectionTitle} id={headingId}>
              {section.title}
            </h2>
          )}
          {renderArea(
            section.id,
            section.cards,
            m.editor_no_cards_in_section({}, { locale: language }),
          )}
          {editing && (
            <editor.AddCardButton
              label={m.editor_add_card_to_section(
                { section: section.title || m.editor_section_fallback({}, { locale: language }) },
                { locale: language },
              )}
              section={section.id}
              onEvent={onEditorEvent ?? noEvent}
            />
          )}
        </section>
      );
    });

  return (
    <div ref={surface} class={styles.content} data-editor-surface={editing ? '' : undefined}>
      {total === 0 && !editorMode && (
        <p class={styles.emptyView} data-testid="empty-view">
          {t('No cards in this view yet')}
        </p>
      )}
      {showRoot && (
        <div class={styles.section}>
          {renderArea(
            null,
            view.cards,
            m.editor_no_cards_outside_sections({}, { locale: language }),
          )}
          {editing && hasSections && (
            <editor.AddCardButton
              label={m.editor_add_card_outside_sections({}, { locale: language })}
              section={null}
              onEvent={onEditorEvent ?? noEvent}
            />
          )}
        </div>
      )}
      {hasSections &&
        (editing ? (
          <editor.SectionList class={styles.sections} onEvent={onEditorEvent ?? noEvent}>
            {renderSections()}
          </editor.SectionList>
        ) : (
          <div class={styles.sections}>{renderSections()}</div>
        ))}
    </div>
  );
}
