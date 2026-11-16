import type { IconName } from '@everdash/contracts/iconNames';
import type { Entity } from '../../../shared/home-assistant/entities';
import { sensorValue } from '../../sensors/data/readings';

export interface ValueOptions {
  /** Overrides the entity's unit. An empty string hides the unit. */
  unit?: string;
  /** Decimal places for numeric states. */
  precision?: number;
}

export type ValueStatus = 'loading' | 'ready' | 'unavailable' | 'offline';

export interface ValueReading {
  status: ValueStatus;
  value: string;
  unit: string;
}

/** The icon for a value card: the chosen one, or one picked from the entity's device class. */
export function valueIcon(icon: IconName | undefined, entity: Entity | undefined): IconName {
  if (icon) {
    return icon;
  }

  const kind = entity?.attributes.device_class;
  if (kind === 'temperature') {
    return 'thermometer';
  }

  if (kind === 'humidity' || kind === 'moisture') {
    return 'droplet';
  }

  if (kind === 'power' || kind === 'energy' || kind === 'current' || kind === 'voltage') {
    return 'bolt';
  }

  if (kind === 'battery') {
    return 'battery';
  }

  if (kind === 'illuminance') {
    return 'sun';
  }

  if (kind === 'wind_speed') {
    return 'wind';
  }

  return 'gauge';
}

function isPlainNumber(entity: Entity): boolean {
  return (
    !entity.entity_id.startsWith('binary_sensor.') &&
    entity.state.trim() !== '' &&
    Number.isFinite(Number(entity.state))
  );
}

/** Formats a sensor or input_number state, applying the card's precision and unit overrides. */
export function readValue(
  entity: Entity | undefined,
  options: ValueOptions,
  state: { online: boolean; ready: boolean },
  locale: string,
): ValueReading {
  if (!state.online) {
    return { status: 'offline', unit: '', value: '—' };
  }

  if (!entity && !state.ready) {
    return { status: 'loading', unit: '', value: '…' };
  }

  const base = sensorValue(entity, locale);
  if (!entity || !base.available) {
    return { status: 'unavailable', unit: '', value: '—' };
  }

  let { value } = base;
  if (options.precision !== undefined && isPlainNumber(entity)) {
    value = Number(entity.state).toLocaleString(locale, {
      maximumFractionDigits: options.precision,
      minimumFractionDigits: options.precision,
    });
  }

  return {
    status: 'ready',
    unit: options.unit === undefined ? base.unit : options.unit,
    value,
  };
}
