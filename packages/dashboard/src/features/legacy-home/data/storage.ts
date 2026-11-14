import type { DemoDevice } from './data';
import { createDevices } from './data';
import { restoreDevices } from './state';

const key = 'legacy-home:devices:v1';

export function loadDevices(): DemoDevice[] {
  try {
    return restoreDevices(globalThis.localStorage?.getItem(key) || null);
  } catch {
    return createDevices();
  }
}

export function saveDevices(devices: readonly DemoDevice[]): boolean {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(devices));
    return true;
  } catch {
    return false;
  }
}
