import { editorKeys } from './editorKeys';
import { useMemo, useRef } from 'preact/hooks';
import type { AppConfig, DashboardDocument } from '@everdash/contracts/config/types';
import { validateDashboard } from '@everdash/contracts/config/validate';
import { LanguageProvider } from '@everdash/ui/i18n/index';
import type { Language } from '@everdash/ui/i18n/index';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { createDevice, mapState } from '../features/accessories/data/model';
import { mapClimate, createClimate } from '../features/climate/data/model';
import { DashboardCards } from '../features/dashboard/components/DashboardCards/DashboardCards';
import { useContainerWidth } from '../features/dashboard/hooks/useContainerWidth';
import type {
  CardLocation,
  EditorEvent,
  EditorSelection,
} from '../features/dashboard/data/editorEvent';
import type { EditorKit } from '../features/dashboard/data/editorKit';
import { parseEntities, resolveDashboard } from '../features/dashboard/data/discovery';
import { SensorBadges } from '../features/sensors/components/SensorBadges/SensorBadges';
import styles from './DashboardCanvas.module.css';

export interface CanvasSnapshot {
  config: DashboardDocument;
  states: unknown[];
  forecasts: Record<string, readonly unknown[]>;
  now: number;
  generation: number;
  editor: boolean;
}

export interface DashboardCanvasProps {
  snapshot: CanvasSnapshot;
  selectedView: string;
  /** Editor only: UI language for the canvas and its chrome. Defaults to `'en'`. */
  language?: Language;
  /** Editor only: the card, badge or section to outline. The tablet never passes it. */
  selection?: EditorSelection;
  /** Editor only: new cards that still need an entity, outlined as such. */
  incomplete?: readonly CardLocation[];
  onAction: (action: Record<string, unknown>) => void;
}

/** What the component takes: the public props plus the editor chrome, which only the editor loads. */
export interface DashboardCanvasInnerProps extends DashboardCanvasProps {
  editorKit?: EditorKit;
}

export function DashboardCanvas({
  snapshot,
  selectedView,
  language = 'en',
  selection,
  incomplete,
  editorKit,
  onAction,
}: DashboardCanvasInnerProps) {
  const canvasRef = useRef<HTMLElement>(null);
  const canvasWidth = useContainerWidth(canvasRef);
  const breakpoints = {
    'data-bp-899': canvasWidth <= 899 ? '' : undefined,
    'data-bp-699': canvasWidth <= 699 ? '' : undefined,
    'data-bp-599': canvasWidth <= 599 ? '' : undefined,
    'data-bp-360': canvasWidth <= 360 ? '' : undefined,
  };

  const model = useMemo(() => {
    if (!snapshot) {
      return null;
    }
    const validation = validateDashboard(snapshot.config);
    if (!validation.ok) {
      return null;
    }
    const entities = parseEntities(snapshot.states);
    const resolved = resolveDashboard(validation.config, entities);
    const readings = Object.fromEntries(entities.map((entity) => [entity.entity_id, entity]));
    const devices = resolved.cards.map((card) => {
      const device = createDevice(card);
      const state = readings[card.entityId];
      return state ? mapState(device, state) : { ...device, availability: 'missing' as const };
    });
    const climates = resolved.climates.map((climate) => {
      const state = readings[climate.entityId];
      return state
        ? mapClimate(createClimate(climate), state)
        : { ...createClimate(climate), availability: 'missing' as const };
    });
    return { config: validation.config as AppConfig, resolved, readings, devices, climates };
  }, [snapshot]);

  const currentSnapshot = snapshot;
  if (!model || !currentSnapshot) {
    return (
      <main ref={canvasRef} class={styles.mainContent} {...breakpoints}>
        <p>{m.editor_canvas_open_builder({}, { locale: language })}</p>
      </main>
    );
  }
  const view =
    model.resolved.views.find((item) => item.id === selectedView) ?? model.resolved.views[0];
  if (!view) {
    return (
      <main ref={canvasRef} class={styles.mainContent} {...breakpoints}>
        <p>{m.editor_canvas_no_view({}, { locale: language })}</p>
      </main>
    );
  }
  const postEditorAction = (type: string, details: Record<string, unknown> = {}) => {
    onAction({
      type: `everdash.editor.${type}`,
      generation: snapshot.generation,
      viewId: view.id,
      ...details,
    });
  };
  const rawView = snapshot.config.views.find((item) => item.id === view.id);
  const editorKeysFor = (section: string | null) =>
    editorKeys(
      section === null
        ? (rawView?.cards ?? [])
        : (rawView?.sections?.find((item) => item.id === section)?.cards ?? []),
    );
  const postCardEvent = (event: EditorEvent) => {
    const { type, ...details } = event;

    postEditorAction(type, details);
  };

  return (
    <LanguageProvider language={language}>
      <main ref={canvasRef} class={styles.mainContent} data-theme="light" {...breakpoints}>
        <SensorBadges
          badges={view.badges}
          readings={model.readings}
          online
          editor={currentSnapshot.editor ? editorKit : undefined}
          selectedIndex={selection?.kind === 'badge' ? selection.index : undefined}
          onEditorEvent={(event) => currentSnapshot.editor && postCardEvent(event)}
        />
        <DashboardCards
          view={view}
          editor={editorKit}
          editorKeys={editorKeysFor}
          devices={model.devices}
          climates={model.climates}
          onClimateChange={() => undefined}
          readings={model.readings}
          forecasts={currentSnapshot.forecasts}
          online
          now={currentSnapshot.now}
          timeZone={model.config.timeZone}
          onToggle={() => undefined}
          onDetails={() => undefined}
          editorMode={currentSnapshot.editor}
          selectedCard={selection?.kind === 'card' ? selection : undefined}
          selectedSection={selection?.kind === 'section' ? selection.section : undefined}
          incompleteCards={incomplete}
          onEditorEvent={(event) => currentSnapshot.editor && postCardEvent(event)}
          readOnly={!currentSnapshot.editor}
        />
      </main>
    </LanguageProvider>
  );
}
