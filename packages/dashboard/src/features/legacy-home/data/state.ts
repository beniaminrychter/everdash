import { createDevices } from './data';
import type { DemoDevice } from './data';

export type Scene = 'away' | 'movie';

export function toggleDevice(device: DemoDevice): void {
  if (device.type === 'outlet') {
    device.on = !device.on;
    return;
  }
  if (device.on) {
    if (device.brightness > 0) {
      device.lastBrightness = device.brightness;
    }
    device.brightness = 0;
    device.on = false;
    return;
  }
  device.on = true;
  device.brightness = Math.max(1, device.lastBrightness);
}

export function setBrightness(device: DemoDevice, value: number): void {
  if (device.type !== 'light' || !Number.isFinite(value)) {
    return;
  }
  const brightness = Math.max(0, Math.min(100, Math.round(value)));
  if (brightness === 0) {
    if (device.brightness > 0) {
      device.lastBrightness = device.brightness;
    }
    device.brightness = 0;
    device.on = false;
    return;
  }
  device.brightness = brightness;
  device.lastBrightness = brightness;
  device.on = true;
}

export function setColor(device: DemoDevice, value: string): void {
  if (device.id !== 'sofa-light' || !/^#[0-9a-f]{6}$/i.test(value)) {
    return;
  }
  device.color = value.toLowerCase();
}

export function applyScene(devices: DemoDevice[], scene: Scene): void {
  if (scene === 'away') {
    devices.forEach((device) => {
      device.on = false;
      if (device.type === 'light') {
        if (device.brightness > 0) {
          device.lastBrightness = device.brightness;
        }
        device.brightness = 0;
      }
    });
    return;
  }
  devices.forEach((device, index) => {
    if (device.type === 'light') {
      setBrightness(device, index === 0 ? 15 : index === 1 ? 20 : 0);
    } else {
      device.on = index === 4;
    }
  });
}

export function restoreDevices(serialized: string | null): DemoDevice[] {
  const devices = createDevices();
  if (!serialized) {
    return devices;
  }
  try {
    const saved: unknown = JSON.parse(serialized);
    if (!Array.isArray(saved)) {
      return devices;
    }
    for (const item of saved) {
      if (typeof item !== 'object' || item === null || !('id' in item)) {
        continue;
      }
      const device = devices.find((candidate) => candidate.id === item.id);
      if (!device) {
        continue;
      }
      const value = item as Record<string, unknown>;
      if (typeof value.on === 'boolean') {
        device.on = value.on;
      }
      if (device.type === 'light') {
        if (
          typeof value.brightness === 'number' &&
          Number.isFinite(value.brightness) &&
          value.brightness >= 0 &&
          value.brightness <= 100
        ) {
          device.brightness = Math.round(value.brightness);
        }
        if (
          typeof value.lastBrightness === 'number' &&
          Number.isFinite(value.lastBrightness) &&
          value.lastBrightness > 0 &&
          value.lastBrightness <= 100
        ) {
          device.lastBrightness = Math.max(1, Math.min(100, Math.round(value.lastBrightness)));
        }
        if (typeof value.color === 'string') {
          setColor(device, value.color);
        }
        if (device.on && device.brightness === 0) {
          device.brightness = device.lastBrightness;
        }
      }
    }
  } catch {
    return devices;
  }
  return devices;
}
