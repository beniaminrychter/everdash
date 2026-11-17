import type { CatalogApi } from '@everdash/contracts/home-assistant/contracts';
import { HomeAssistantError } from '../../../shared/home-assistant/client';
import { hasState } from '../../../shared/dashboard/readings';
import { parseForecastResponse } from '../../weather/data/forecast';
import { isEntity, parseEntities, resolveDashboard } from './discovery';
import type { AppConfig } from '@everdash/contracts/config';
import {
  defaultForecastType,
  forecastKey,
  resolveForecastType,
} from '@everdash/contracts/config/weatherForecast';
import type { ForecastType } from '@everdash/contracts/config/weatherForecast';
import { viewCards } from '@everdash/contracts/config/sections';
import type { Entity, EntityReadings, ResolvedDashboard } from './types';

export interface ObservationSnapshot {
  resolved: ResolvedDashboard;
  readings: EntityReadings;
  forecasts: Readonly<Record<string, readonly unknown[]>>;
  ready: boolean;
  error: string | null;
  updatedAt: number | null;
}

/** How long a forecast is reused: hours change faster than days. */
const forecastTtlMs: Readonly<Record<ForecastType, number>> = {
  daily: 3_600_000,
  hourly: 900_000,
};

interface ForecastRequest {
  entityId: string;
  /** The forecast type to ask Home Assistant for, which can differ from what the card asked for. */
  type: ForecastType;
}

export class ObservationStore {
  private snapshot: ObservationSnapshot;
  private listeners = new Set<() => void>();
  private active = true;
  private stopped = false;
  private running = false;
  private polling = false;
  private rerun = false;
  private rerunManual = false;
  private authFailed = false;
  private revision = 0;
  private lastDiscovery = 0;
  /** When each forecast stops being fresh, by forecast key; failed reads are remembered too. */
  private forecastExpires: Record<string, number> = {};
  private timer?: ReturnType<typeof setTimeout>;
  constructor(
    private readonly config: AppConfig,
    private readonly api: CatalogApi,
  ) {
    this.snapshot = {
      error: null,
      forecasts: {},
      readings: {},
      ready: false,
      resolved: resolveDashboard(config, []),
      updatedAt: null,
    };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private emit(patch: Partial<ObservationSnapshot>) {
    if (this.stopped) {
      return;
    }
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private schedule() {
    clearTimeout(this.timer);
    if (this.running && this.active && !this.stopped && !this.authFailed) {
      this.timer = setTimeout(
        () => {
          void this.refresh(false, false);
        },
        Math.max(5000, this.config.polling.observationsMs),
      );
    }
  }
  start() {
    this.running = true;
    void this.refresh();
  }
  setActive(active: boolean) {
    if (this.active === active) {
      return;
    }
    this.active = active;
    clearTimeout(this.timer);
    if (!active) {
      this.revision++;
    } else if (!this.authFailed) {
      if (this.polling) {
        this.rerun = true;
      } else {
        void this.refresh(false, false);
      }
    }
  }
  async refresh(discover = false, manual = true): Promise<void> {
    if (this.stopped || !this.active) {
      return;
    }
    if (this.polling) {
      if (manual || discover) {
        this.rerun = true;
      }
      if (manual) {
        this.rerunManual = true;
      }
      return;
    }
    if (manual) {
      this.authFailed = false;
    }
    if (this.authFailed) {
      return;
    }
    clearTimeout(this.timer);
    this.polling = true;
    const { revision } = this;
    try {
      if (
        discover ||
        !this.snapshot.ready ||
        Date.now() - this.lastDiscovery >= this.config.polling.metadataMs
      ) {
        const raw = await this.api.getStates();
        if (this.stopped || revision !== this.revision) {
          return;
        }
        const entities = parseEntities(raw);
        const resolved = resolveDashboard(this.config, entities);
        // Keep the command store mounted when sensor values or other metadata change.
        if (JSON.stringify(resolved.cards) === JSON.stringify(this.snapshot.resolved.cards)) {
          resolved.cards = this.snapshot.resolved.cards;
        }
        if (JSON.stringify(resolved.climates) === JSON.stringify(this.snapshot.resolved.climates)) {
          resolved.climates = this.snapshot.resolved.climates;
        }
        const readings: Record<string, Entity> = {};
        const ids = new Set(resolved.observationIds);
        entities.forEach((entity) => {
          if (ids.has(entity.entity_id)) {
            readings[entity.entity_id] = entity;
          }
        });
        this.lastDiscovery = Date.now();
        this.emit({
          error: null,
          readings,
          ready: true,
          resolved,
          updatedAt: Date.now(),
        });
      } else {
        const readings: Record<string, Entity> = {};
        let transportFailures = 0;
        let authenticationError: string | null = null;
        await Promise.all(
          this.snapshot.resolved.observationIds.map(async (id) => {
            try {
              const entity = await this.api.getState(id);
              if (!isEntity(entity) || entity.entity_id !== id) {
                throw new HomeAssistantError('Invalid sensor response.');
              }
              readings[id] = entity;
            } catch (error) {
              const status = error instanceof HomeAssistantError ? error.status : 0;
              if (status === 401 || status === 403) {
                authenticationError = error instanceof Error ? error.message : null;
                return;
              }

              if (status === 404) {
                // A missing entity only affects its own card or badge.
                return;
              }

              // Transport failure: keep the last known reading for this entity.
              transportFailures++;
              const previous = this.snapshot.readings[id];
              if (previous) {
                readings[id] = previous;
              }
            }
          }),
        );
        if (this.stopped || revision !== this.revision) {
          return;
        }
        this.authFailed = Boolean(authenticationError);
        if (authenticationError) {
          this.forecastExpires = {};
        }
        this.emit({
          readings: authenticationError ? {} : readings,
          ...(authenticationError ? { forecasts: {} } : {}),
          error:
            authenticationError ||
            (transportFailures ? 'Some readings are unavailable. Refresh to retry.' : null),
          ...(authenticationError || transportFailures ? {} : { updatedAt: Date.now() }),
        });
      }
      if (!this.authFailed) {
        await this.refreshForecasts(manual, revision);
      }
    } catch (error) {
      if (this.stopped || revision !== this.revision) {
        return;
      }
      this.authFailed =
        error instanceof HomeAssistantError && (error.status === 401 || error.status === 403);
      if (this.authFailed) {
        this.forecastExpires = {};
      }
      // Offline or server errors keep the last known readings, and forecasts inside their cache window.
      this.emit({
        ...(this.authFailed
          ? { readings: {}, forecasts: {} }
          : { forecasts: this.freshForecasts() }),
        error: error instanceof Error ? error.message : 'Home Assistant data is unavailable.',
      });
    } finally {
      this.polling = false;
      if (this.rerun && this.active && !this.stopped && (this.rerunManual || !this.authFailed)) {
        const manualRerun = this.rerunManual;
        this.rerun = false;
        this.rerunManual = false;
        void this.refresh(true, manualRerun);
      } else {
        this.schedule();
      }
    }
  }
  /** Forecasts that are still inside their cache window. */
  private freshForecasts(): Record<string, readonly unknown[]> {
    const forecasts: Record<string, readonly unknown[]> = {};
    for (const [key, forecast] of Object.entries(this.snapshot.forecasts)) {
      const expires = this.forecastExpires[key];
      if (expires !== undefined && Date.now() < expires) {
        forecasts[key] = forecast;
      } else {
        delete this.forecastExpires[key];
      }
    }

    return forecasts;
  }

  /**
   * The forecasts the weather cards need, by snapshot key. A card gets the type it asked for, or the
   * other one when its entity does not offer it; an hourly card also reads the daily forecast
   * for today's high and low when the entity offers one.
   */
  private forecastRequests(): Map<string, ForecastRequest> {
    const requests = new Map<string, ForecastRequest>();
    this.snapshot.resolved.views.forEach((view) =>
      viewCards(view).forEach((card) => {
        if (card.type !== 'weather') {
          return;
        }
        const entity = this.snapshot.readings[card.entity];
        if (!hasState(entity)) {
          return;
        }
        const features = entity.attributes.supported_features;
        const requested = card.forecast ?? defaultForecastType;
        const resolved = resolveForecastType(requested, features);
        if (!resolved.type) {
          return;
        }
        requests.set(forecastKey(card.entity, requested), {
          entityId: card.entity,
          type: resolved.type,
        });
        if (resolved.type === 'hourly') {
          const daily = resolveForecastType('daily', features);
          if (daily.type === 'daily' && !daily.fellBack) {
            requests.set(forecastKey(card.entity, 'daily'), {
              entityId: card.entity,
              type: 'daily',
            });
          }
        }
      }),
    );

    return requests;
  }

  private async refreshForecasts(manual: boolean, revision: number) {
    if (this.stopped || revision !== this.revision) {
      return;
    }
    const requests = this.forecastRequests();
    const forecasts = { ...this.snapshot.forecasts };
    // Forecasts nobody asks for any more, such as after a card changes its type, are dropped.
    Object.keys(forecasts).forEach((key) => {
      if (!requests.has(key)) {
        delete forecasts[key];
        delete this.forecastExpires[key];
      }
    });
    await Promise.all(
      [...requests].map(async ([key, { entityId, type }]) => {
        const expires = this.forecastExpires[key];
        if (!manual && expires !== undefined && Date.now() < expires) {
          return;
        }
        try {
          forecasts[key] = parseForecastResponse(
            await this.api.getWeatherForecast(entityId, type),
            entityId,
          );
        } catch {
          delete forecasts[key];
        }
        if (!this.stopped && revision === this.revision) {
          this.forecastExpires[key] = Date.now() + forecastTtlMs[type];
        }
      }),
    );
    if (!this.stopped && revision === this.revision) {
      this.emit({ forecasts });
    }
  }
  stop() {
    this.stopped = true;
    this.revision++;
    clearTimeout(this.timer);
    this.api.abort();
    this.listeners.clear();
  }
}
