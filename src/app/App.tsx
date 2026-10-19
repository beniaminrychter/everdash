import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { LanguageProvider, createTranslator, translateMessage } from '../shared/i18n/index';
import type { AppConfig } from '../shared/config';
import type { DashboardDocument } from '../shared/config/types';
import type { RuntimeSnapshot } from '../features/configuration/data/api';
import { useClimate } from '../features/climate/data/useClimate';
import { useToast } from './hooks/useToast';
import { useHomeAssistant } from '../features/accessories/data/useHomeAssistant';
import { useDashboard } from '../features/dashboard/data/useDashboard';
import { useEnvironment } from './hooks/useEnvironment';
import { usePreferences } from '../features/settings/hooks/usePreferences';
import { usePreventZoom } from './hooks/usePreventZoom';
import { hardReload } from './hardReload';
import { DashboardPicker } from '../features/dashboard/components/DashboardPicker/DashboardPicker';
import { SensorBadges } from '../features/sensors/components/SensorBadges/SensorBadges';
import { Settings } from '../features/settings/components/Settings/Settings';
import { Toast } from '../shared/ui/Toast/Toast';
import { DashboardCards } from '../features/dashboard/components/DashboardCards/DashboardCards';
import { Modal } from '../shared/ui/Modal/Modal';
import { LightControls } from '../features/accessories/components/LightControls/LightControls';
import { Icon } from '../shared/ui/Icon/Icon';
import { IconButton } from '../shared/ui/IconButton/IconButton';
import { ConnectedDataSources } from '../features/settings/components/ConnectedDataSources/ConnectedDataSources';
import styles from './App.module.css';

type OpenModal = { kind: 'light'; deviceId: string } | { kind: 'settings' } | null;
interface Props {
  config: AppConfig;
  mode?: 'direct' | 'management';
  revision: string;
  dashboardDocument: DashboardDocument;
  onConfigPublished: (snapshot: RuntimeSnapshot) => void;
}
export function App({
  config,
  mode = 'direct',
  revision,
  dashboardDocument,
  onConfigPublished,
}: Props) {
  usePreventZoom();
  const dashboard = useDashboard(config);
  const commandPage = useMemo(
    () => ({ cards: dashboard.resolved.cards, pollIntervalMs: config.polling.controlsMs }),
    [config.polling.controlsMs, dashboard.resolved.cards],
  );
  const home = useHomeAssistant(commandPage);
  const climate = useClimate(dashboard.resolved.climates, config.polling.controlsMs);
  const { toast, notify } = useToast();
  useEffect(() => {
    if (home.actionFailure) {
      notify(home.actionFailure.message);
    }
  }, [home.actionFailure, notify]);
  useEffect(() => {
    if (climate.actionFailure) {
      notify(climate.actionFailure.message);
    }
  }, [climate.actionFailure, notify]);
  const { online, now } = useEnvironment();
  const reading = (id: string | undefined) => (id ? dashboard.readings[id] : undefined);
  const sun = online ? reading(dashboard.resolved.sun?.entityId)?.state : undefined;
  const { preferences, setPreferences, storageError } = usePreferences(config.views, sun);
  const t = useMemo(() => createTranslator(preferences.language), [preferences.language]);
  useEffect(() => {
    document.documentElement.lang = preferences.language;
    document.title = t('EverDash');
  }, [preferences.language, t]);
  const page =
    dashboard.resolved.views.find((item) => item.id === preferences.page) ||
    dashboard.resolved.views[0];
  const [modal, setModal] = useState<OpenModal>(null);
  const closeModal = useCallback(() => setModal(null), []);
  const openState =
    modal?.kind === 'light'
      ? home.devices.find((device) => device.id === modal.deviceId)
      : undefined;
  const openDefinition = openState
    ? page.cards.find((card) => card.entity === openState.id)
    : undefined;
  const openDevice =
    openState && openDefinition
      ? { ...openState, icon: openDefinition.icon, name: openDefinition.name, room: page.title }
      : undefined;
  const showingModal = modal?.kind === 'settings' || Boolean(openDevice);
  const hasOpenDevice = Boolean(openDevice);
  useEffect(() => {
    if (modal?.kind === 'light' && !hasOpenDevice) {
      setModal(null);
    }
  }, [modal, hasOpenDevice]);
  const toggle = (id: string) => {
    const device = home.devices.find((item) => item.id === id);
    if (device && online) {
      home.update(id, { on: !device.on });
    }
  };
  const refresh = () => {
    dashboard.refresh();
    home.refresh();
    climate.refresh();
  };
  const connectionReady =
    dashboard.ready &&
    (home.updatedAt !== null || dashboard.resolved.cards.length === 0) &&
    (climate.updatedAt !== null || dashboard.resolved.climates.length === 0);
  const connectionMessage = online
    ? home.error ||
      climate.error ||
      dashboard.error ||
      (connectionReady ? 'Connected to Home Assistant' : 'Connecting to Home Assistant…')
    : 'You’re offline. Controls will reconnect when the network returns.';
  const connectionProblem = !online || Boolean(home.error || climate.error || dashboard.error);
  return (
    <LanguageProvider language={preferences.language}>
      {toast.visible && <Toast message={translateMessage(toast.message, t)} visible />}
      <main class={styles.mainContent} aria-hidden={showingModal || undefined}>
        <header class={styles.dashboardHeader}>
          <DashboardPicker
            pages={config.views}
            selected={page.id}
            onSelect={(id) => setPreferences((previous) => ({ ...previous, page: id }))}
          />
          <IconButton
            label={t('Settings')}
            onClick={() => setModal({ kind: 'settings' })}
            className={styles.settingsButton}
          >
            <span
              class={`${styles.connectionDot} ${connectionProblem ? styles.connectionProblem : connectionReady ? styles.connectionReady : ''}`}
              aria-hidden="true"
            />
            <Icon name="more" />
          </IconButton>
        </header>
        <SensorBadges badges={page.badges} readings={dashboard.readings} online={online} />
        {connectionProblem && (
          <button
            type="button"
            class={styles.connectionNotice}
            onClick={() => setModal({ kind: 'settings' })}
          >
            {online ? t('Connection needs attention') : t('Offline')} · {t('Open Settings')}
          </button>
        )}
        <DashboardCards
          view={page}
          devices={home.devices}
          climates={climate.climates}
          onClimateChange={climate.update}
          readings={dashboard.readings}
          forecasts={dashboard.forecasts}
          online={online}
          now={now}
          timeZone={config.timeZone}
          onToggle={toggle}
          onDetails={(id) => setModal({ deviceId: id, kind: 'light' })}
        />
      </main>
      {openDevice && (
        <Modal
          title={openDevice.name}
          eyebrow={openDevice.room}
          closeLabel={t('Close settings')}
          onClose={closeModal}
        >
          <LightControls
            device={openDevice}
            disabled={!online}
            onToggle={() => toggle(openDevice.id)}
            onBrightness={(value) => home.update(openDevice.id, { brightness: value }, 250)}
            onColor={(value) => home.update(openDevice.id, { color: value }, 250)}
          />
        </Modal>
      )}
      {modal?.kind === 'settings' && (
        <Modal title={t('Settings')} closeLabel={t('Close settings')} onClose={closeModal}>
          <Settings
            language={preferences.language}
            onLanguage={(language) => setPreferences((previous) => ({ ...previous, language }))}
            appearance={preferences.appearance}
            onAppearance={(appearance) =>
              setPreferences((previous) => ({ ...previous, appearance }))
            }
            connection={translateMessage(connectionMessage, t)}
            online={online}
            onRefresh={refresh}
            sunAvailable={sun === 'above_horizon' || sun === 'below_horizon'}
            storageError={storageError}
            onHardReload={hardReload}
            accessMode={mode}
            configRevision={revision}
            dashboardDocument={dashboardDocument}
            onConfigPublished={onConfigPublished}
          />
          <ConnectedDataSources
            view={page}
            sunEntityId={config.sun}
            devices={home.devices}
            climates={climate.climates}
            readings={dashboard.readings}
          />
        </Modal>
      )}
    </LanguageProvider>
  );
}
