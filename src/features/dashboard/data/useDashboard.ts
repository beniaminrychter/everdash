import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { createClient, validateConnection } from '../../../shared/home-assistant/client';
import { resolveDashboard } from './discovery';
import { ObservationStore } from './store';
import type { ObservationSnapshot } from './store';
import type { AppConfig } from '../../../shared/config';

export function useDashboard(config: AppConfig) {
  const [snapshot, setSnapshot] = useState<ObservationSnapshot>(() => ({
    error: null,
    forecasts: {},
    readings: {},
    ready: false,
    resolved: resolveDashboard(config, []),
    updatedAt: null,
  }));
  const store = useRef<ObservationStore | null>(null);
  useEffect(() => {
    let current: ObservationStore;
    try {
      current = new ObservationStore(
        config,
        createClient(
          validateConnection(
            import.meta.env.VITE_HOME_ASSISTANT_URL || '',
            import.meta.env.VITE_HOME_ASSISTANT_TOKEN || '',
          ),
        ),
      );
    } catch (error) {
      setSnapshot((previous) => ({
        ...previous,
        error: error instanceof Error ? error.message : 'Invalid Home Assistant configuration.',
      }));
      return;
    }
    store.current = current;
    const unsubscribe = current.subscribe(() => setSnapshot(current.getSnapshot()));
    const updateActive = () => current.setActive(!document.hidden && navigator.onLine);
    document.addEventListener('visibilitychange', updateActive);
    window.addEventListener('online', updateActive);
    window.addEventListener('offline', updateActive);
    updateActive();
    current.start();
    return () => {
      unsubscribe();
      current.stop();
      store.current = null;
      document.removeEventListener('visibilitychange', updateActive);
      window.removeEventListener('online', updateActive);
      window.removeEventListener('offline', updateActive);
    };
  }, [config]);
  const refresh = useCallback(() => {
    void store.current?.refresh(true);
  }, []);
  return { ...snapshot, refresh };
}
