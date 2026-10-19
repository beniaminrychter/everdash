import { isEntity } from '../../../shared/home-assistant/entities';
import type { LiveDevice } from '../../accessories/data/model';
import type { ClimateCommand } from '../../../shared/home-assistant/contracts';

export interface ClimateBinding {
  entityId: `climate.${string}`;
  name: string;
  temperatureUnit: '°C' | '°F';
}
export interface LiveClimate extends ClimateBinding {
  availability: LiveDevice['availability'];
  temperature: number | null;
  min: number | null;
  max: number | null;
  step: number;
  hvacMode: string;
  fanMode: string;
  hvacModes: readonly string[];
  fanModes: readonly string[];
  temperatureSupported: boolean;
}
export interface ClimateChange {
  temperature?: number;
  hvacMode?: string;
  fanMode?: string;
}
export type ClimateField = keyof ClimateChange;
export const climateFields: readonly ClimateField[] = ['temperature', 'hvacMode', 'fanMode'];
const numeric = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
export function createClimate(binding: ClimateBinding): LiveClimate {
  return {
    ...binding,
    availability: 'loading',
    fanMode: '',
    fanModes: [],
    hvacMode: '',
    hvacModes: [],
    max: null,
    min: null,
    step: 1,
    temperature: null,
    temperatureSupported: false,
  };
}
export function mapClimate(previous: LiveClimate, raw: unknown): LiveClimate {
  if (!isEntity(raw) || raw.entity_id !== previous.entityId) {
    throw new Error('Invalid climate entity response.');
  }
  const a = raw.attributes;
  const available = !['unavailable', 'unknown', 'none', ''].includes(
    raw.state.trim().toLowerCase(),
  );
  const step = numeric(a.target_temp_step);
  return {
    ...previous,
    availability: available ? 'available' : 'unavailable',
    fanMode: available && typeof a.fan_mode === 'string' ? a.fan_mode : '',
    fanModes: strings(a.fan_modes),
    hvacMode: available ? raw.state : '',
    hvacModes: strings(a.hvac_modes),
    max: numeric(a.max_temp),
    min: numeric(a.min_temp),
    step: step !== null && step > 0 ? step : 1,
    temperature: available ? numeric(a.temperature) : null,
    temperatureSupported:
      typeof a.supported_features === 'number'
        ? Boolean(a.supported_features & 1)
        : numeric(a.temperature) !== null,
  };
}
export function stepTemperature(state: LiveClimate, direction: -1 | 1): number | null {
  if (
    state.temperature === null ||
    state.min === null ||
    state.max === null ||
    !state.temperatureSupported
  ) {
    return null;
  }
  const next = Math.round((state.temperature + direction * state.step) * 10_000) / 10_000;
  return Math.max(state.min, Math.min(state.max, next));
}
export function climateCommand(state: LiveClimate, change: ClimateChange): ClimateCommand {
  if (Object.keys(change).length !== 1) {
    throw new Error('Change one climate setting at a time.');
  }
  const data: ClimateCommand['data'] = { entity_id: state.entityId };
  if (change.temperature !== undefined) {
    const value = change.temperature;
    if (
      !state.temperatureSupported ||
      !Number.isFinite(value) ||
      state.min === null ||
      state.max === null ||
      value < state.min ||
      value > state.max
    ) {
      throw new Error('Unsupported temperature.');
    }
    data.temperature = value;
    return { data, domain: 'climate', service: 'set_temperature' };
  }
  if (change.hvacMode !== undefined) {
    if (!state.hvacModes.includes(change.hvacMode)) {
      throw new Error('Unsupported HVAC mode.');
    }
    data.hvac_mode = change.hvacMode;
    return { data, domain: 'climate', service: 'set_hvac_mode' };
  }
  if (change.fanMode !== undefined) {
    if (!state.fanModes.includes(change.fanMode)) {
      throw new Error('Unsupported fan mode.');
    }
    data.fan_mode = change.fanMode;
    return { data, domain: 'climate', service: 'set_fan_mode' };
  }
  throw new Error('Unsupported climate setting.');
}
