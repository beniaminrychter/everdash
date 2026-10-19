import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { createClient, validateConnection } from '../../../shared/home-assistant/client';
import { createDevice } from './model';
import type { DesiredState, PageConfig } from './model';
import { HomeAssistantStore } from './store';
import type { HomeSnapshot } from './store';

export function useHomeAssistant(page: PageConfig) {
  const [snapshot, setSnapshot] = useState<HomeSnapshot>(() => ({
    actionFailure: null,
    devices: page.cards.map(createDevice),
    error: null,
    updatedAt: null,
  }));
  const store = useRef<HomeAssistantStore | null>(null);
  useEffect(() => {
    let connection;
    try {
      connection = validateConnection(
        import.meta.env.VITE_HOME_ASSISTANT_URL || '',
        import.meta.env.VITE_HOME_ASSISTANT_TOKEN || '',
      );
    } catch (error) {
      setSnapshot({
        devices: page.cards.map((card) => ({ ...createDevice(card), availability: 'error' })),
        error: error instanceof Error ? error.message : 'Invalid Home Assistant configuration.',
        actionFailure: null,
        updatedAt: null,
      });
      return;
    }
    const current = new HomeAssistantStore(page, createClient(connection));
    store.current = current;
    setSnapshot(current.getSnapshot());
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
  }, [page]);
  const update = useCallback(
    (id: string, desired: DesiredState, debounceMs = 0) =>
      store.current?.update(id, desired, debounceMs),
    [],
  );
  const refresh = useCallback(() => {
    void store.current?.refresh();
  }, []);
  return { ...snapshot, refresh, update };
}
