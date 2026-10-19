import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { AppConfig, DashboardDocument } from '../src/shared/config/types';
import { validateDashboard } from '../src/shared/config/validate';
import { LanguageProvider } from '../src/shared/i18n/index';
import { createDevice, mapState } from '../src/features/accessories/data/model';
import { mapClimate, createClimate } from '../src/features/climate/data/model';
import { DashboardCards } from '../src/features/dashboard/components/DashboardCards/DashboardCards';
import { DashboardPicker } from '../src/features/dashboard/components/DashboardPicker/DashboardPicker';
import { parseEntities, resolveDashboard } from '../src/features/dashboard/data/discovery';
import { SensorBadges } from '../src/features/sensors/components/SensorBadges/SensorBadges';
import styles from './Preview.module.css';
import '../src/app/App.module.css';

interface PreviewSnapshot {
  config: DashboardDocument;
  states: unknown[];
  now: number;
}

const previewNonce = new URLSearchParams(window.location.search).get('nonce');
const parentOrigin = new URLSearchParams(window.location.search).get('parentOrigin');

function Preview() {
  const [snapshot, setSnapshot] = useState<PreviewSnapshot | null>(null);
  const [selectedView, setSelectedView] = useState('');

  useEffect(() => {
    let readyTimer: number | undefined;
    const receive = (event: MessageEvent<unknown>) => {
      if (event.source !== window.parent || event.origin !== parentOrigin || !previewNonce) {
        return;
      }
      if (typeof event.data !== 'object' || event.data === null || !('type' in event.data)) {
        return;
      }
      const data = event.data as {
        type?: unknown;
        nonce?: unknown;
        config?: unknown;
        states?: unknown;
      };
      if (data.type === 'everdash.preview.ack' && data.nonce === previewNonce) {
        window.clearInterval(readyTimer);
        return;
      }
      if (
        data.type !== 'everdash.preview' ||
        data.nonce !== previewNonce ||
        !Array.isArray(data.states)
      ) {
        return;
      }
      const validation = validateDashboard(data.config);
      if (validation.ok) {
        setSnapshot({ config: validation.document, states: data.states, now: Date.now() });
        setSelectedView(validation.document.views[0]?.id ?? '');
      }
    };
    window.addEventListener('message', receive);
    if (previewNonce && parentOrigin) {
      const announceReady = () =>
        window.parent.postMessage({ type: 'everdash.preview.ready', nonce: previewNonce }, '*');
      announceReady();
      readyTimer = window.setInterval(announceReady, 150);
    }
    return () => {
      window.clearInterval(readyTimer);
      window.removeEventListener('message', receive);
    };
  }, []);

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

  if (!model) {
    return (
      <main class={styles.mainContent}>
        <p>Open the Preview tab to load a read-only snapshot.</p>
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

  return (
    <LanguageProvider language="en">
      <main class={styles.mainContent}>
        <header class={styles.dashboardHeader}>
          <DashboardPicker
            pages={model.config.views}
            selected={view.id}
            onSelect={setSelectedView}
          />
          <span aria-label="Read-only preview">Preview · read only</span>
        </header>
        <SensorBadges badges={view.badges} readings={model.readings} online />
        <DashboardCards
          view={view}
          devices={model.devices}
          climates={model.climates}
          onClimateChange={() => undefined}
          readings={model.readings}
          forecasts={{}}
          online
          now={snapshot?.now ?? 0}
          timeZone={model.config.timeZone}
          onToggle={() => undefined}
          onDetails={() => undefined}
          readOnly
        />
      </main>
    </LanguageProvider>
  );
}

const root = document.querySelector('#preview');
if (root) {
  render(<Preview />, root);
}
