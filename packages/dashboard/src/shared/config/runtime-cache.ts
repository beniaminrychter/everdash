export const runtimeConfigStorageKey = 'everdash:offline-config:v1';

export function clearOfflineRuntimeConfig(
  storage: Pick<Storage, 'removeItem'> = localStorage,
): void {
  try {
    storage.removeItem(runtimeConfigStorageKey);
  } catch {
    // Browser storage is optional; server authorization remains authoritative.
  }
}
