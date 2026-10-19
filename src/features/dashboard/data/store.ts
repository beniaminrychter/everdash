import type { CatalogApi } from '../../../shared/home-assistant/contracts';
import { HomeAssistantError } from '../../../shared/home-assistant/client';
import { hasState } from '../../../shared/dashboard/readings';
import { parseForecastResponse } from '../../weather/data/forecast';
import { isEntity, parseEntities, resolveDashboard } from './discovery';
import type { AppConfig } from '../../../shared/config';
import type { Entity, EntityReadings, ResolvedDashboard } from './types';

export interface ObservationSnapshot {
  resolved: ResolvedDashboard;
  readings: EntityReadings;
  forecasts: Readonly<Record<string, readonly unknown[]>>;
  ready: boolean;
  error: string | null;
  updatedAt: number | null;
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
  private forecastChecked: Record<string, number> = {};
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
        let failures = 0;
        let authenticationError: string | null = null;
        await Promise.all(
          this.snapshot.resolved.observationIds.map(async (id) => {
            try {
              const entity = await this.api.getState(id);
              if (!isEntity(entity) || entity.entity_id !== id) {
                throw new Error('Invalid sensor response.');
              }
              readings[id] = entity;
            } catch (error) {
              failures++;
              if (
                error instanceof HomeAssistantError &&
                (error.status === 401 || error.status === 403)
              ) {
                authenticationError = error.message;
              }
            }
          }),
        );
        if (this.stopped || revision !== this.revision) {
          return;
        }
        this.authFailed = Boolean(authenticationError);
        if (authenticationError) {
          this.forecastChecked = {};
        }
        this.emit({
          readings: authenticationError ? {} : readings,
          ...(authenticationError ? { forecasts: {} } : {}),
          error:
            authenticationError ||
            (failures ? 'Some readings are unavailable. Refresh to retry.' : null),
          updatedAt: Date.now(),
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
      this.forecastChecked = {};
      this.emit({
        readings: {},
        forecasts: {},
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
  private async refreshForecasts(manual: boolean, revision: number) {
    if (this.stopped || revision !== this.revision) {
      return;
    }
    const ids = new Set<string>();
    this.snapshot.resolved.views.forEach((view) =>
      view.cards.forEach((card) => {
        if (card.type === 'weather') {
          ids.add(card.entity);
        }
      }),
    );
    const forecasts = { ...this.snapshot.forecasts };
    await Promise.all(
      [...ids].map(async (id) => {
        const entity = this.snapshot.readings[id];
        const features = entity?.attributes.supported_features;
        if (!hasState(entity) || (typeof features === 'number' && (features & 2) === 0)) {
          delete forecasts[id];
          delete this.forecastChecked[id];
          return;
        }
        if (
          !manual &&
          this.forecastChecked[id] !== undefined &&
          Date.now() - this.forecastChecked[id] < 900_000
        ) {
          return;
        }
        try {
          forecasts[id] = parseForecastResponse(await this.api.getWeatherForecast(id), id);
        } catch {
          delete forecasts[id];
        }
        if (!this.stopped && revision === this.revision) {
          this.forecastChecked[id] = Date.now();
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
