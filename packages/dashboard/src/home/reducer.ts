import { createDevices } from '../features/legacy-home/data/data';
import type { DemoDevice } from '../features/legacy-home/data/data';
import {
  applyScene,
  setBrightness,
  setColor,
  toggleDevice,
} from '../features/legacy-home/data/state';

export interface HomeState {
  activeScene: 'away' | 'movie' | null;
  devices: DemoDevice[];
}

export type HomeAction =
  | { type: 'toggle'; id: string }
  | { type: 'brightness'; id: string; value: number }
  | { type: 'color'; id: string; value: string }
  | { type: 'scene'; scene: 'away' | 'movie' };

export function homeReducer(state: HomeState, action: HomeAction): HomeState {
  if (action.type === 'scene') {
    const devices = state.devices.map((device) => ({ ...device }));
    applyScene(devices, action.scene);
    return { activeScene: action.scene, devices };
  }
  const current = state.devices.find((candidate) => candidate.id === action.id);
  if (
    !current ||
    (action.type === 'brightness' &&
      (current.type !== 'light' || !Number.isFinite(action.value))) ||
    (action.type === 'color' &&
      (current.id !== 'sofa-light' || !/^#[0-9a-f]{6}$/i.test(action.value)))
  ) {
    return state;
  }
  const devices = state.devices.map((device) => ({ ...device }));
  const device = devices.find((candidate) => candidate.id === action.id)!;
  if (action.type === 'toggle') {
    toggleDevice(device);
  } else if (action.type === 'brightness') {
    setBrightness(device, action.value);
  } else {
    setColor(device, action.value);
  }
  return { activeScene: null, devices };
}

export function createHomeState(): HomeState {
  return { activeScene: null, devices: createDevices() };
}
