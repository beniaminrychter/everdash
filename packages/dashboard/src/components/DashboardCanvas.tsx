import { editorKeys } from './editorKeys';
import { useMemo } from 'preact/hooks';
import type { AppConfig, DashboardDocument } from '@everdash/contracts/config/types';
import { validateDashboard } from '@everdash/contracts/config/validate';
import { LanguageProvider } from '@everdash/ui/i18n/index';
import { createDevice, mapState } from '../features/accessories/data/model';
import { mapClimate, createClimate } from '../features/climate/data/model';
import { DashboardCards } from '../features/dashboard/components/DashboardCards/DashboardCards';
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
  /** Editor only: the card or badge to outline. The tablet never passes it. */
  selection?: { kind: 'card' | 'badge'; index: number };
  onAction: (action: Record<string, unknown>) => void;
}

export function DashboardCanvas({
  snapshot,
  selectedView,
  selection,
  onAction,
}: DashboardCanvasProps) {
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
      <main class={styles.mainContent}>
        <p>Open the dashboard builder to load its current view.</p>
      </main>
    );
  }
  const view =
    model.resolved.views.find((item) => item.id === selectedView) ?? model.resolved.views[0];
  if (!view) {
    return (
      <main class={styles.mainContent}>
        <p>This dashboard has no view to display.</p>
      </main>
    );
  }
  const postEditorAction = (
    type: 'card.edit' | 'card.delete' | 'card.move' | 'badge.edit' | 'badge.delete' | 'view.select',
    index?: number,
    offset?: number,
    viewId?: string,
  ) => {
    onAction({
      type: `everdash.editor.${type}`,
      generation: snapshot.generation,
      viewId: viewId ?? view.id,
      index,
      offset,
    });
  };

  return (
    <LanguageProvider language="en">
      <main class={styles.mainContent}>
        <SensorBadges
          badges={view.badges}
          readings={model.readings}
          online
          editorMode={currentSnapshot.editor}
          selectedIndex={selection?.kind === 'badge' ? selection.index : undefined}
          onEdit={(index) => currentSnapshot.editor && postEditorAction('badge.edit', index)}
          onDelete={(index) => currentSnapshot.editor && postEditorAction('badge.delete', index)}
        />
        <DashboardCards
          view={view}
          editorKeys={editorKeys(
            snapshot.config.views.find((item) => item.id === view.id)?.cards ?? [],
          )}
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
          selectedIndex={selection?.kind === 'card' ? selection.index : undefined}
          onEditorAction={(action, index, offset) =>
            currentSnapshot.editor &&
            postEditorAction(action === 'move' ? 'card.move' : `card.${action}`, index, offset)
          }
          readOnly={!currentSnapshot.editor}
        />
      </main>
    </LanguageProvider>
  );
}
