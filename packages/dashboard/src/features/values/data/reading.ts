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

/** The generic icon that normalize assigns; it is replaced by a device-class icon when known. */
const genericIcon: IconName = 'gauge';

/** Picks a device-class icon for a value card that still uses the generic default icon. */
export function valueIcon(icon: IconName, entity: Entity | undefined): IconName {
  if (icon !== genericIcon || !entity) {
    return icon;
  }

  const kind = entity.attributes.device_class;
  if (kind === 'temperature') {
    return 'thermometer';
  }

  if (kind === 'humidity' || kind === 'moisture') {
    return 'droplet';
  }

  return icon;
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
