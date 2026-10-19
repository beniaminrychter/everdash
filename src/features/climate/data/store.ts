import { HomeAssistantError } from '../../../shared/home-assistant/client';
import type { ClimateApi } from '../../../shared/home-assistant/contracts';
import type { ActionFailure } from '../../../shared/types/actionFailure';
import { climateCommand, climateFields, createClimate, mapClimate } from './model';
import type { ClimateBinding, ClimateChange, ClimateField, LiveClimate } from './model';

export interface ClimateSnapshot {
  climates: readonly LiveClimate[];
  error: string | null;
  actionFailure: ActionFailure | null;
  updatedAt: number | null;
}
export class ClimateStore {
  private snapshot: ClimateSnapshot;
  private listeners = new Set<() => void>();
  private confirmed = new Map<string, LiveClimate>();
  private queued = new Map<string, ClimateChange>();
  private versions = new Map<string, number>();
  private sending = new Set<string>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private pollTimer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private sequence = 0;
  private active = true;
  private running = false;
  private stopped = false;
  private polling = false;
  private authFailed = false;
  constructor(
    bindings: readonly ClimateBinding[],
    private readonly interval: number,
    private readonly api: ClimateApi,
  ) {
    this.snapshot = {
      actionFailure: null,
      climates: bindings.map(createClimate),
      error: null,
      updatedAt: null,
    };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private emit(patch: Partial<ClimateSnapshot>) {
    if (this.stopped) {
      return;
    }
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private current(id: string) {
    return this.snapshot.climates.find((item) => item.entityId === id);
  }
  private replace(value: LiveClimate) {
    this.emit({
      climates: this.snapshot.climates.map((item) =>
        item.entityId === value.entityId ? value : item,
      ),
    });
  }
  private version(id: string, field: ClimateField) {
    return this.versions.get(`${id}:${field}`) || 0;
  }
  private pending(id: string) {
    return this.sending.has(id) || this.queued.has(id);
  }
  private schedule() {
    clearTimeout(this.pollTimer);
    if (
      this.running &&
      this.active &&
      !this.stopped &&
      !this.authFailed &&
      this.snapshot.climates.length
    ) {
      this.pollTimer = setTimeout(
        () => {
          void this.refresh(false);
        },
        Math.max(1000, this.interval),
      );
    }
  }
  start() {
    this.running = true;
    void this.refresh();
  }
  private cancel() {
    this.generation++;
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.queued.clear();
    this.emit({
      climates: this.snapshot.climates.map((item) => this.confirmed.get(item.entityId) || item),
    });
  }
  setActive(active: boolean) {
    if (active === this.active) {
      return;
    }
    this.active = active;
    clearTimeout(this.pollTimer);
    if (!active) {
      this.cancel();
    } else if (!this.authFailed) {
      void this.refresh(false);
    }
  }
  async refresh(manual = true) {
    if (this.stopped || !this.active || this.polling) {
      return;
    }
    if (manual) {
      this.authFailed = false;
    }
    if (this.authFailed) {
      return;
    }
    clearTimeout(this.pollTimer);
    this.polling = true;
    const { generation } = this;
    let pollError: string | null = null;
    let success = false;
    await Promise.all(
      this.snapshot.climates.map(async (item) => {
        const id = item.entityId;
        if (this.pending(id)) {
          return;
        }
        const versions = climateFields.map((field) => this.version(id, field));
        const valid = () =>
          !this.stopped &&
          this.active &&
          !this.authFailed &&
          generation === this.generation &&
          !this.pending(id) &&
          climateFields.every((field, index) => this.version(id, field) === versions[index]);
        try {
          const raw = await this.api.getState(id);
          if (!valid()) {
            return;
          }
          const value = mapClimate(this.current(id)!, raw);
          this.confirmed.set(id, value);
          this.replace(value);
          success = true;
        } catch (error) {
          if (!valid()) {
            return;
          }
          const message = error instanceof Error ? error.message : 'Air conditioner unavailable.';
          pollError = message;
          const status = error instanceof HomeAssistantError ? error.status : 0;
          if (status === 401 || status === 403) {
            this.rejectAuthentication(message);
          } else {
            this.replace({
              ...this.current(id)!,
              availability: status === 404 ? 'missing' : 'error',
            });
          }
        }
      }),
    );
    this.polling = false;
    if (generation !== this.generation) {
      if (!this.stopped && this.active && !this.authFailed) {
        void this.refresh(false);
      }
      return;
    }
    this.emit({ error: pollError, updatedAt: success ? Date.now() : this.snapshot.updatedAt });
    this.schedule();
  }
  private rejectAuthentication(error: string) {
    this.authFailed = true;
    this.cancel();
    clearTimeout(this.pollTimer);
    this.emit({
      climates: this.snapshot.climates.map((item) => ({ ...item, availability: 'error' })),
      error,
    });
  }
  update(id: string, change: ClimateChange, debounceMs = 0) {
    const current = this.current(id);
    if (
      this.stopped ||
      !this.active ||
      this.authFailed ||
      !current ||
      current.availability !== 'available'
    ) {
      return;
    }
    climateCommand(current, change);
    const field = climateFields.find((key) => change[key] !== undefined)!;
    this.versions.set(`${id}:${field}`, this.version(id, field) + 1);
    this.queued.set(id, { ...this.queued.get(id), ...change });
    this.replace({ ...current, ...change });
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    if (debounceMs) {
      this.timers.set(
        id,
        setTimeout(() => {
          this.timers.delete(id);
          void this.flush(id);
        }, debounceMs),
      );
    } else {
      void this.flush(id);
    }
  }
  private async flush(id: string): Promise<void> {
    const queued = this.queued.get(id);
    if (this.stopped || !this.active || this.authFailed || this.sending.has(id) || !queued) {
      return;
    }
    const field = climateFields.find((key) => queued[key] !== undefined)!;
    const change = { [field]: queued[field] } as ClimateChange;
    delete queued[field];
    if (!Object.keys(queued).length) {
      this.queued.delete(id);
    }
    const version = this.version(id, field);
    const generation = this.generation;
    this.sending.add(id);
    try {
      await this.api.callService(climateCommand(this.current(id)!, change));
      if (this.stopped || !this.active || this.authFailed || generation !== this.generation) {
        return;
      }
      const accepted = { ...this.confirmed.get(id)!, ...change };
      this.confirmed.set(id, accepted);
      if (this.version(id, field) === version) {
        this.replace({ ...this.current(id)!, ...change });
      }
      this.emit({ updatedAt: Date.now() });
    } catch (error) {
      if (this.stopped || generation !== this.generation) {
        return;
      }
      const status = error instanceof HomeAssistantError ? error.status : 0;
      if (status === 401 || status === 403) {
        this.rejectAuthentication(
          error instanceof Error ? error.message : 'Home Assistant rejected the token.',
        );
      } else if (status === 404) {
        this.queued.delete(id);
        clearTimeout(this.timers.get(id));
        this.timers.delete(id);
        this.replace({ ...this.confirmed.get(id)!, availability: 'missing' });
      } else if (this.version(id, field) === version) {
        this.replace({ ...this.current(id)!, [field]: this.confirmed.get(id)![field] });
      }
      this.emit({
        actionFailure: {
          entityId: id,
          message: `Couldn’t update ${this.current(id)!.name}.`,
          sequence: ++this.sequence,
        },
      });
    } finally {
      this.sending.delete(id);
      if (!this.stopped && this.queued.has(id) && !this.timers.has(id)) {
        void this.flush(id);
      }
    }
  }
  stop() {
    this.stopped = true;
    this.generation++;
    clearTimeout(this.pollTimer);
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.queued.clear();
    this.listeners.clear();
    this.api.abort();
  }
}
