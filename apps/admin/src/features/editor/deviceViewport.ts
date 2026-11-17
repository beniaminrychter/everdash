import type { RegisteredDevice } from '@everdash/contracts/auth/devices';

export type ViewportOrientation = 'portrait' | 'landscape';

export type PreviewZoom = 'fit' | '50' | '75' | '100';

export const previewZoomOptions: readonly { value: PreviewZoom; label: string }[] = [
  { value: 'fit', label: 'Fit to screen' },
  { value: '50', label: '50%' },
  { value: '75', label: '75%' },
  { value: '100', label: '100%' },
];

export interface DeviceViewportOption {
  id: string;
  label: string;
  width: number;
  height: number;
  defaultOrientation: ViewportOrientation;
}

export interface ResolvedViewport {
  deviceId: string;
  label: string;
  width: number;
  height: number;
  orientation: ViewportOrientation;
}

const screenSizePattern = /^\s*(\d+)\s*[×xX]\s*(\d+)\s*$/;

export function parseScreenSize(screenSize: string): { width: number; height: number } | null {
  const match = screenSizePattern.exec(screenSize);

  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
}

export function toDeviceViewportOptions(
  devices: readonly RegisteredDevice[],
): DeviceViewportOption[] {
  const options: DeviceViewportOption[] = [];

  for (const device of devices) {
    const parsed = parseScreenSize(device.screenSize);

    if (!parsed) {
      continue;
    }

    const label = device.name.trim() || device.deviceType;
    const defaultOrientation: ViewportOrientation =
      parsed.width > parsed.height ? 'landscape' : 'portrait';

    options.push({
      id: device.id,
      label,
      width: parsed.width,
      height: parsed.height,
      defaultOrientation,
    });
  }

  return options;
}

export function resolveDeviceViewport(
  option: DeviceViewportOption,
  orientation: ViewportOrientation,
): ResolvedViewport {
  const shortSide = Math.min(option.width, option.height);
  const longSide = Math.max(option.width, option.height);

  return {
    deviceId: option.id,
    label: option.label,
    width: orientation === 'portrait' ? shortSide : longSide,
    height: orientation === 'portrait' ? longSide : shortSide,
    orientation,
  };
}

export function resolvePreviewScale(
  zoom: PreviewZoom,
  viewport: { width: number; height: number },
  available: { width: number; height: number },
): number {
  if (zoom === '50') {
    return 0.5;
  }

  if (zoom === '75') {
    return 0.75;
  }

  if (zoom === '100') {
    return 1;
  }

  if (
    available.width <= 0 ||
    available.height <= 0 ||
    viewport.width <= 0 ||
    viewport.height <= 0
  ) {
    return 1;
  }

  const scale = Math.min(1, available.width / viewport.width, available.height / viewport.height);

  return Math.round(Math.max(0.25, scale) * 10000) / 10000;
}
