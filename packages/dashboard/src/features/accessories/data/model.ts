import type { Device } from '@everdash/contracts/types/index';
import type { ServiceCommand } from '@everdash/contracts/home-assistant/contracts';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import { defaultAccent } from '../../../shared/color/tint';

export type CardConfig = {
  name: string;
  room: string;
  icon: IconName;
} & (
  | { type: 'light'; entityId: `light.${string}` }
  | { type: 'outlet'; entityId: `switch.${string}` }
  | { type: 'toggle'; entityId: `input_boolean.${string}` | `switch.${string}` }
);

export interface PageConfig {
  pollIntervalMs: number;
  cards: readonly CardConfig[];
}

export interface LiveDevice extends Device {
  availability: 'loading' | 'available' | 'unavailable' | 'missing' | 'error';
  dimmable: boolean;
  pending: boolean;
}

export interface DesiredState {
  on?: boolean;
  brightness?: number;
  color?: string;
}

export function createDevice(card: CardConfig): LiveDevice {
  return {
    availability: 'loading',
    brightness: 0,
    color: card.type === 'light' ? '#ffb33f' : defaultAccent,
    colorCapable: false,
    dimmable: false,
    icon: card.icon,
    id: card.entityId,
    lastBrightness: 100,
    name: card.name,
    on: false,
    pending: false,
    room: card.room,
    type: card.type,
  };
}

/** Accent colour for an accessory tile: RGB lights keep their bulb colour; all others share the default accent. */
export function deviceAccent(device: Pick<Device, 'color' | 'colorCapable'>): string {
  return device.colorCapable ? device.color : defaultAccent;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mapState(previous: LiveDevice, value: unknown): LiveDevice {
  if (
    !isRecord(value) ||
    value.entity_id !== previous.id ||
    typeof value.state !== 'string' ||
    !isRecord(value.attributes)
  ) {
    throw new Error('Invalid Home Assistant entity response.');
  }
  const { attributes } = value;
  const modes = Array.isArray(attributes.supported_color_modes)
    ? attributes.supported_color_modes
    : [];
  const legacyFeatures =
    typeof attributes.supported_features === 'number' ? attributes.supported_features : 0;
  const isLight = previous.type === 'light';
  const brightness =
    typeof attributes.brightness === 'number' && Number.isFinite(attributes.brightness)
      ? Math.max(0, Math.min(100, Math.round((attributes.brightness / 255) * 100)))
      : previous.lastBrightness;
  const rgb = attributes.rgb_color;
  const validRgb =
    Array.isArray(rgb) &&
    rgb.length === 3 &&
    rgb.every(
      (channel) =>
        typeof channel === 'number' && Number.isFinite(channel) && channel >= 0 && channel <= 255,
    );
  return {
    ...previous,
    availability: value.state === 'on' || value.state === 'off' ? 'available' : 'unavailable',
    brightness: value.state === 'on' ? brightness : 0,
    color: validRgb
      ? '#' +
        rgb
          .map((channel) =>
            Math.round(channel as number)
              .toString(16)
              .padStart(2, '0'),
          )
          .join('')
      : previous.color,
    colorCapable:
      isLight &&
      (modes.length
        ? modes.some((mode) => ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'].includes(mode as string))
        : Boolean(legacyFeatures & 16)),
    dimmable:
      isLight &&
      (modes.length
        ? modes.some((mode) => mode !== 'onoff' && mode !== 'unknown')
        : Boolean(legacyFeatures & 1)),
    lastBrightness: brightness > 0 ? brightness : previous.lastBrightness,
    on: value.state === 'on',
    pending: false,
  };
}

function commandDomain(card: CardConfig): ServiceCommand['domain'] {
  if (card.type === 'light') {
    return 'light';
  }

  if (card.type === 'toggle' && card.entityId.startsWith('input_boolean.')) {
    return 'input_boolean';
  }

  return 'switch';
}

export function createCommand(card: CardConfig, desired: DesiredState): ServiceCommand {
  if (card.type !== 'light' && (desired.brightness !== undefined || desired.color !== undefined)) {
    throw new Error('Only a light supports brightness and color.');
  }
  if (desired.brightness !== undefined && !Number.isFinite(desired.brightness)) {
    throw new Error('Invalid brightness.');
  }
  if (desired.color !== undefined && !/^#[0-9a-f]{6}$/i.test(desired.color)) {
    throw new Error('Invalid color.');
  }
  const off = desired.on === false || desired.brightness === 0;
  const data: ServiceCommand['data'] = { entity_id: card.entityId };
  if (!off && desired.brightness !== undefined) {
    data.brightness_pct = Math.max(1, Math.min(100, Math.round(desired.brightness)));
  }
  if (!off && desired.color) {
    data.rgb_color = [1, 3, 5].map((start) => parseInt(desired.color!.slice(start, start + 2), 16));
  }
  return {
    data,
    domain: commandDomain(card),
    service: off ? 'turn_off' : 'turn_on',
  };
}
