import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { createClient, validateConnection } from '../../../shared/home-assistant/client';
import { createClimate } from './model';
import type { ClimateBinding, ClimateChange } from './model';
import { ClimateStore } from './store';
import type { ClimateSnapshot } from './store';

export function useClimate(bindings: readonly ClimateBinding[], interval: number) {
  const [snapshot, setSnapshot] = useState<ClimateSnapshot>(() => ({
    actionFailure: null,
    climates: bindings.map(createClimate),
    error: null,
    updatedAt: null,
  }));
  const store = useRef<ClimateStore | null>(null);
  useEffect(() => {
    if (!bindings.length) {
      return;
    }
    let current: ClimateStore;
    try {
      current = new ClimateStore(
        bindings,
        interval,
        createClient(
          validateConnection(
            import.meta.env.VITE_HOME_ASSISTANT_URL || '',
            import.meta.env.VITE_HOME_ASSISTANT_TOKEN || '',
          ),
        ),
      );
    } catch (error) {
      setSnapshot({
        climates: bindings.map((binding) => ({ ...createClimate(binding), availability: 'error' })),
        error: error instanceof Error ? error.message : 'Invalid Home Assistant configuration.',
        actionFailure: null,
        updatedAt: null,
      });
      return;
    }
    store.current = current;
    setSnapshot(current.getSnapshot());
    const unsubscribe = current.subscribe(() => setSnapshot(current.getSnapshot()));
    const active = () => current.setActive(!document.hidden && navigator.onLine);
    document.addEventListener('visibilitychange', active);
    window.addEventListener('online', active);
    window.addEventListener('offline', active);
    active();
    current.start();
    return () => {
      unsubscribe();
      current.stop();
      store.current = null;
      document.removeEventListener('visibilitychange', active);
      window.removeEventListener('online', active);
      window.removeEventListener('offline', active);
    };
  }, [bindings, interval]);
  const update = useCallback(
    (id: string, change: ClimateChange, debounceMs = 0) =>
      store.current?.update(id, change, debounceMs),
    [],
  );
  const refresh = useCallback(() => {
    void store.current?.refresh();
  }, []);
  return { ...snapshot, refresh, update };
}
