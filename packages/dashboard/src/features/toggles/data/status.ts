import type { LiveDevice } from '../../accessories/data/model';
import type { Entity } from '../../../shared/home-assistant/entities';
import { sensorValue } from '../../sensors/data/readings';

export interface ToggleStatus {
  /** English state text; translate it at the UI boundary. */
  text: string;
  problem: boolean;
  on: boolean;
}

const availabilityText = {
  available: '',
  error: 'Disconnected',
  loading: 'Loading…',
  missing: 'Entity not found',
  unavailable: 'Unavailable',
} as const;

/** State of a switch or input_boolean control. */
export function controlStatus(device: LiveDevice): ToggleStatus {
  if (device.availability !== 'available') {
    return {
      on: false,
      problem: device.availability !== 'loading',
      text: availabilityText[device.availability],
    };
  }

  return { on: device.on, problem: false, text: device.on ? 'On' : 'Off' };
}

/** State of a read-only binary_sensor, using the device-class labels of sensor badges. */
export function sensorStatus(
  entity: Entity | undefined,
  state: { online: boolean; ready: boolean },
  locale: string,
): ToggleStatus {
  if (!state.online) {
    return { on: false, problem: true, text: 'Disconnected' };
  }

  if (!entity && !state.ready) {
    return { on: false, problem: false, text: 'Loading…' };
  }

  const reading = sensorValue(entity, locale);
  if (!entity || !reading.available) {
    return { on: false, problem: true, text: 'Unavailable' };
  }

  return { on: entity.state === 'on', problem: false, text: reading.value };
}
