import {
  defaultForecastType,
  forecastKey,
  resolveForecastType,
} from '@everdash/contracts/config/weatherForecast';
import type { ForecastType } from '@everdash/contracts/config/weatherForecast';
import { viewCards } from '@everdash/contracts/config/sections';
import type { AppConfig } from '@everdash/contracts/config/types';
import type { HomeAssistantTransport } from '../home-assistant/client';

function supportedFeatures(states: unknown, entityId: string): unknown {
  if (!Array.isArray(states)) {
    return undefined;
  }

  for (const state of states) {
    if (
      typeof state === 'object' &&
      state !== null &&
      'entity_id' in state &&
      state.entity_id === entityId &&
      'attributes' in state &&
      typeof state.attributes === 'object' &&
      state.attributes !== null
    ) {
      return (state.attributes as Record<string, unknown>).supported_features;
    }
  }

  return undefined;
}

async function readForecast(
  homeAssistant: HomeAssistantTransport,
  entityId: string,
  type: ForecastType,
  signal: AbortSignal,
): Promise<readonly unknown[]> {
  try {
    const result = await homeAssistant.callService(
      'weather',
      'get_forecasts',
      { entity_id: entityId, type },
      signal,
    );
    const response = (result as { service_response?: Record<string, unknown> } | null)
      ?.service_response;
    const entity = response?.[entityId];
    const forecast = (entity as { forecast?: unknown } | undefined)?.forecast;

    return Array.isArray(forecast) ? forecast : [];
  } catch {
    return [];
  }
}

/**
 * The forecasts a draft's weather cards need, keyed like the tablet snapshot: each card gets the type
 * it asked for (or the one its entity offers instead), and an hourly card also gets the daily
 * forecast its today's high and low come from.
 */
export async function readPreviewForecasts(
  homeAssistant: HomeAssistantTransport,
  config: AppConfig,
  states: unknown,
  signal: AbortSignal,
): Promise<Record<string, readonly unknown[]>> {
  const requests = new Map<string, { entityId: string; type: ForecastType }>();

  for (const view of config.views) {
    for (const card of viewCards(view)) {
      if (card.type !== 'weather') {
        continue;
      }

      const features = supportedFeatures(states, card.entity);
      const requested = card.forecast ?? defaultForecastType;
      const resolved = resolveForecastType(requested, features);

      if (!resolved.type) {
        continue;
      }

      requests.set(forecastKey(card.entity, requested), {
        entityId: card.entity,
        type: resolved.type,
      });

      const daily = resolveForecastType('daily', features);

      if (resolved.type === 'hourly' && daily.type === 'daily' && !daily.fellBack) {
        requests.set(forecastKey(card.entity, 'daily'), { entityId: card.entity, type: 'daily' });
      }
    }
  }

  const entries = await Promise.all(
    [...requests].map(
      async ([key, { entityId, type }]) =>
        [key, await readForecast(homeAssistant, entityId, type, signal)] as const,
    ),
  );

  return Object.fromEntries(entries);
}
