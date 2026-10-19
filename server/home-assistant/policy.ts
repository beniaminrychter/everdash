import type { AppConfig, CardConfig } from '../../src/shared/config/types';
import { PolicyError } from './policy-error';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function configuredEntityIds(config: AppConfig): Set<string> {
  const entityIds = new Set<string>();
  if (config.sun) {
    entityIds.add(config.sun);
  }
  for (const view of config.views) {
    for (const badge of view.badges) {
      entityIds.add(badge.entity);
    }
    for (const card of view.cards) {
      entityIds.add(card.entity);
      if (card.type === 'pstryk') {
        for (const id of [card.sellPrice, card.nextPrice, card.usage, card.schedule]) {
          if (id) {
            entityIds.add(id);
          }
        }
      }
    }
  }
  return entityIds;
}

export function filterConfiguredStates(states: unknown, config: AppConfig): unknown[] {
  if (!Array.isArray(states)) {
    throw new PolicyError('Home Assistant returned an invalid state catalog.');
  }
  const configured = configuredEntityIds(config);
  return states.filter(
    (state) =>
      isRecord(state) && typeof state.entity_id === 'string' && configured.has(state.entity_id),
  );
}

function isConfiguredCard(
  config: AppConfig,
  entityId: string,
  types: readonly CardConfig['type'][],
): boolean {
  return config.views.some((view) =>
    view.cards.some((card) => card.entity === entityId && types.includes(card.type)),
  );
}

function assertKeys(data: Record<string, unknown>, allowed: readonly string[]) {
  for (const key of Object.keys(data)) {
    if (!allowed.includes(key)) {
      throw new PolicyError('The service payload contains unsupported fields.');
    }
  }
}

function assertEntity(
  data: Record<string, unknown>,
  domain: string,
  config: AppConfig,
  types: readonly CardConfig['type'][],
): string {
  if (
    typeof data.entity_id !== 'string' ||
    !data.entity_id.startsWith(`${domain}.`) ||
    !isConfiguredCard(config, data.entity_id, types)
  ) {
    throw new PolicyError('The target entity is not configured for this service.');
  }
  return data.entity_id;
}

export function validateServiceCommand(
  domain: string,
  service: string,
  input: unknown,
  config: AppConfig,
): Record<string, unknown> {
  if (!isRecord(input)) {
    throw new PolicyError('The service payload must be an object.');
  }
  if (domain === 'light' && (service === 'turn_on' || service === 'turn_off')) {
    assertKeys(
      input,
      service === 'turn_on' ? ['entity_id', 'brightness_pct', 'rgb_color'] : ['entity_id'],
    );
    assertEntity(input, 'light', config, ['light']);
    if (
      input.brightness_pct !== undefined &&
      (service !== 'turn_on' ||
        typeof input.brightness_pct !== 'number' ||
        !Number.isFinite(input.brightness_pct) ||
        input.brightness_pct < 0 ||
        input.brightness_pct > 100)
    ) {
      throw new PolicyError('brightness_pct must be a number between 0 and 100.');
    }
    if (
      input.rgb_color !== undefined &&
      (service !== 'turn_on' ||
        !Array.isArray(input.rgb_color) ||
        input.rgb_color.length !== 3 ||
        input.rgb_color.some(
          (channel) =>
            typeof channel !== 'number' ||
            !Number.isInteger(channel) ||
            channel < 0 ||
            channel > 255,
        ))
    ) {
      throw new PolicyError('rgb_color must contain three integer channels from 0 to 255.');
    }
    return { ...input };
  }
  if (domain === 'switch' && (service === 'turn_on' || service === 'turn_off')) {
    assertKeys(input, ['entity_id']);
    assertEntity(input, 'switch', config, ['outlet']);
    return { entity_id: input.entity_id };
  }
  if (
    domain === 'climate' &&
    ['set_temperature', 'set_hvac_mode', 'set_fan_mode'].includes(service)
  ) {
    const allowed =
      service === 'set_temperature'
        ? ['entity_id', 'temperature']
        : ['entity_id', service === 'set_hvac_mode' ? 'hvac_mode' : 'fan_mode'];
    assertKeys(input, allowed);
    assertEntity(input, 'climate', config, ['climate']);
    const field =
      service === 'set_temperature'
        ? 'temperature'
        : service === 'set_hvac_mode'
          ? 'hvac_mode'
          : 'fan_mode';
    if (service === 'set_temperature') {
      if (
        typeof input.temperature !== 'number' ||
        !Number.isFinite(input.temperature) ||
        input.temperature < -50 ||
        input.temperature > 100
      ) {
        throw new PolicyError('temperature must be a finite value from -50 to 100.');
      }
    } else if (
      typeof input[field] !== 'string' ||
      !input[field].trim() ||
      input[field].length > 64
    ) {
      throw new PolicyError(`${field} must be a non-empty string of at most 64 characters.`);
    }
    return { ...input };
  }
  if (domain === 'weather' && service === 'get_forecasts') {
    assertKeys(input, ['entity_id', 'type']);
    assertEntity(input, 'weather', config, ['weather']);
    if (input.type !== 'hourly') {
      throw new PolicyError('Only hourly weather forecasts are supported.');
    }
    return { entity_id: input.entity_id, type: input.type };
  }
  throw new PolicyError('This Home Assistant service is not supported.');
}
