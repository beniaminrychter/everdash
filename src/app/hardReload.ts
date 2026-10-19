interface AppRegistration {
  scope: string;
  active?: { scriptURL: string } | null;
  waiting?: { scriptURL: string } | null;
  installing?: { scriptURL: string } | null;
  unregister: () => Promise<boolean>;
}
interface WorkerRegistry {
  getRegistration: (url: string) => Promise<AppRegistration | undefined>;
}
type ShellStorage = Pick<CacheStorage, 'keys' | 'delete'>;
const marker = '__reload';

export function reloadUrl(href: string, timestamp = Date.now()): string {
  const url = new URL(href);
  url.searchParams.set(marker, String(timestamp));
  return url.href;
}

export async function clearAppShell(
  baseURI: string,
  workers?: WorkerRegistry,
  storage?: ShellStorage,
): Promise<void> {
  const scope = new URL('./', baseURI).href;
  const script = new URL('sw.js', scope).href;
  const registration = await workers?.getRegistration(scope);
  if (
    registration?.scope === scope &&
    [registration.active, registration.waiting, registration.installing].some(
      (worker) => worker?.scriptURL === script,
    )
  ) {
    await registration.unregister();
  }
  const prefix = `my-home-${encodeURIComponent(scope)}-`;
  const names = (await storage?.keys()) || [];
  await Promise.all(
    names.filter((name) => name.startsWith(prefix)).map((name) => storage!.delete(name)),
  );
}

function downloadLatest(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fail = () =>
      reject(
        new Error(
          'Cannot download the latest app. Check the app server and your connection, then retry.',
        ),
      );
    xhr.open('GET', url);
    xhr.timeout = 10_000;
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.addEventListener('load', () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : fail(),
    );
    xhr.addEventListener('error', fail);
    xhr.addEventListener('timeout', fail);
    xhr.send();
  });
}

export async function hardReload(): Promise<void> {
  const url = reloadUrl(window.location.href);
  // The unique navigation URL bypasses this app's exact-URL offline cache.
  // Check reachability before removing a working offline copy.
  await downloadLatest(url);
  let workers: WorkerRegistry | undefined;
  let storage: ShellStorage | undefined;
  try {
    workers = navigator.serviceWorker;
  } catch {
    /* Not available on some HTTP origins. */
  }
  try {
    storage = window.caches;
  } catch {
    /* Offline storage is optional. */
  }
  await clearAppShell(document.baseURI, workers, storage);
  window.location.replace(url);
}

export function removeReloadMarker(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(marker)) {
    return;
  }
  url.searchParams.delete(marker);
  window.history.replaceState(window.history.state, '', url.href);
}
