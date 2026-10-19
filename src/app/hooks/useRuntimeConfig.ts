import { useCallback, useEffect, useState } from 'preact/hooks';
import { validateDashboard } from '../../shared/config/validate';
import type { RuntimeSnapshot } from '../../features/configuration/data/api';

export const runtimeConfigStorageKey = 'everdash:offline-config:v1';

export function readOfflineRuntimeConfig(): RuntimeSnapshot | null {
  try {
    const raw = localStorage.getItem(runtimeConfigStorageKey);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('config' in parsed) ||
      !('revision' in parsed)
    ) {
      return null;
    }
    const validation = validateDashboard(parsed.config);
    if (!validation.ok || typeof parsed.revision !== 'string') {
      return null;
    }
    return { revision: parsed.revision, config: validation.document };
  } catch {
    return null;
  }
}

interface Bootstrap {
  revision: string;
  config: unknown;
}

function bootstrap(): Promise<Bootstrap> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'api/bootstrap');
    xhr.timeout = 10_000;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.addEventListener('load', () => {
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error('EverDash returned an invalid response.'));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        const error = new Error('Access to this dashboard has ended.') as Error & {
          status?: number;
        };
        error.status = xhr.status;
        reject(error);
        return;
      }
      if (
        typeof body !== 'object' ||
        body === null ||
        !('revision' in body) ||
        typeof body.revision !== 'string' ||
        !('config' in body)
      ) {
        reject(new Error('EverDash returned an invalid dashboard response.'));
        return;
      }
      resolve({ revision: body.revision, config: body.config });
    });
    xhr.addEventListener('error', () => reject(new Error('Cannot reach EverDash.')));
    xhr.addEventListener('timeout', () => reject(new Error('EverDash did not respond in time.')));
    xhr.send();
  });
}

export function useRuntimeConfig(initial: RuntimeSnapshot, onUnauthorized: () => void) {
  const [snapshot, setSnapshot] = useState(initial);
  const refresh = useCallback(async () => {
    if (!navigator.onLine || document.hidden) {
      return;
    }
    try {
      const result = await bootstrap();
      const validation = validateDashboard(result.config);
      if (!validation.ok) {
        return;
      }
      const next = { revision: result.revision, config: validation.document };
      try {
        localStorage.setItem(runtimeConfigStorageKey, JSON.stringify(next));
      } catch {
        // Layout snapshots are optional; authorization always comes from the server.
      }
      setSnapshot((current) => (current.revision === next.revision ? current : next));
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        error.status === 401
      ) {
        try {
          localStorage.removeItem(runtimeConfigStorageKey);
        } catch {
          // Storage may be unavailable on older/private browser sessions.
        }
        onUnauthorized();
      }
    }
  }, [onUnauthorized]);

  useEffect(() => {
    let active = true;
    const update = () => {
      if (active && !document.hidden && navigator.onLine) {
        refresh();
      }
    };
    const timer = window.setInterval(update, 30_000);
    window.addEventListener('online', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('online', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [refresh]);

  const publish = useCallback((next: RuntimeSnapshot) => {
    setSnapshot(next);
    try {
      localStorage.setItem(runtimeConfigStorageKey, JSON.stringify(next));
    } catch {
      // The server remains authoritative when browser storage is unavailable.
    }
  }, []);

  return { snapshot, publish };
}
