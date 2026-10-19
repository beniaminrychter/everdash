import { HomeAssistantError } from '../../../shared/home-assistant/client';
import type { HomeAssistantApi } from '../../../shared/home-assistant/contracts';
import type { ActionFailure } from '../../../shared/types/actionFailure';
import { createCommand, createDevice, mapState } from './model';
import type { DesiredState, LiveDevice, PageConfig } from './model';

function applyDesired(current: LiveDevice, desired: DesiredState, pending: boolean): LiveDevice {
  const on = desired.on !== false && desired.brightness !== 0;
  const brightness = on
    ? desired.brightness === undefined
      ? current.lastBrightness
      : Math.max(1, Math.min(100, Math.round(desired.brightness)))
    : 0;
  return {
    ...current,
    brightness,
    color: on && desired.color ? desired.color : current.color,
    lastBrightness: brightness > 0 ? brightness : current.lastBrightness,
    on,
    pending,
  };
}

export interface HomeSnapshot {
  devices: readonly LiveDevice[];
  error: string | null;
  actionFailure: ActionFailure | null;
  updatedAt: number | null;
}

export class HomeAssistantStore {
  private snapshot: HomeSnapshot;
  private readonly listeners = new Set<() => void>();
  private readonly confirmed = new Map<string, LiveDevice>();
  private readonly versions = new Map<string, number>();
  private readonly queued = new Map<string, DesiredState>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly sending = new Set<string>();
  private readonly inFlight = new Map<string, DesiredState>();
  private generation = 0;
  private failureSequence = 0;
  private pollTimer?: ReturnType<typeof setTimeout>;
  private polling = false;
  private running = false;
  private active = true;
  private stopped = false;
  private authFailed = false;
  private authError: string | null = null;

  constructor(
    private readonly page: PageConfig,
    private readonly api: HomeAssistantApi,
  ) {
    this.snapshot = {
      actionFailure: null,
      devices: page.cards.map(createDevice),
      error: null,
      updatedAt: null,
    };
  }

  getSnapshot = (): HomeSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit(patch: Partial<HomeSnapshot>) {
    if (this.stopped) {
      return;
    }
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private replace(device: LiveDevice) {
    this.emit({
      devices: this.snapshot.devices.map((current) =>
        current.id === device.id ? device : current,
      ),
    });
  }

  private schedule() {
    clearTimeout(this.pollTimer);
    if (this.running && this.active && !this.stopped && !this.authFailed) {
      this.pollTimer = setTimeout(
        () => {
          void this.refresh(false);
        },
        Math.max(1000, this.page.pollIntervalMs),
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
    clearTimeout(this.pollTimer);
    if (!active) {
      this.cancelPending();
    }
    if (active && !this.authFailed) {
      void this.refresh(false);
    }
  }

  private cancelPending() {
    this.generation++;
    this.inFlight.clear();
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.queued.clear();
    this.emit({
      devices: this.snapshot.devices.map((device) => {
        // Invalidate confirmations for commands which were already sent before the pause.
        if (!device.pending) {
          return device;
        }
        this.versions.set(device.id, (this.versions.get(device.id) || 0) + 1);
        return { ...(this.confirmed.get(device.id) || device), pending: false };
      }),
    });
  }

  async refresh(manual = true): Promise<void> {
    if (this.stopped || !this.active || this.polling) {
      return;
    }
    if (manual) {
      this.authFailed = false;
      this.authError = null;
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
      this.page.cards.map(async (card) => {
        const version = this.versions.get(card.entityId) || 0;
        if (this.snapshot.devices.find((device) => device.id === card.entityId)?.pending) {
          return;
        }
        try {
          const value = await this.api.getState(card.entityId);
          if (
            this.stopped ||
            !this.active ||
            this.generation !== generation ||
            this.authFailed ||
            version !== (this.versions.get(card.entityId) || 0)
          ) {
            return;
          }
          const previous = this.snapshot.devices.find((device) => device.id === card.entityId)!;
          const device = mapState(previous, value);
          this.confirmed.set(device.id, device);
          this.replace(device);
          success = true;
        } catch (error) {
          if (
            this.stopped ||
            !this.active ||
            this.generation !== generation ||
            version !== (this.versions.get(card.entityId) || 0)
          ) {
            return;
          }
          pollError = this.fail(card.entityId, error);
        }
      }),
    );
    this.polling = false;
    if (this.generation !== generation) {
      if (!this.stopped && this.active && !this.authFailed) {
        void this.refresh(false);
      }
      return;
    }
    if (!this.stopped) {
      this.emit({
        error: this.authError || pollError,
        updatedAt: success ? Date.now() : this.snapshot.updatedAt,
      });
      this.schedule();
    }
  }

  private fail(id: string, reason: unknown): string {
    const message = reason instanceof Error ? reason.message : 'Home Assistant request failed.';
    const status = reason instanceof HomeAssistantError ? reason.status : 0;
    if (status === 401 || status === 403) {
      this.authFailed = true;
      this.authError = message;
      clearTimeout(this.pollTimer);
      this.cancelPending();
    }
    const previous =
      this.confirmed.get(id) || this.snapshot.devices.find((device) => device.id === id)!;
    this.replace({
      ...previous,
      availability: status === 404 ? 'missing' : 'error',
      pending: false,
    });
    if (this.authFailed) {
      this.emit({
        devices: this.snapshot.devices.map((device) => ({
          ...device,
          availability: 'error',
          pending: false,
        })),
        error: message,
      });
    }
    return message;
  }

  update(id: string, desired: DesiredState, debounceMs = 0) {
    const current = this.snapshot.devices.find((device) => device.id === id);
    const card = this.page.cards.find((item) => item.entityId === id);
    if (
      this.stopped ||
      !this.active ||
      this.authFailed ||
      !current ||
      !card ||
      current.availability !== 'available'
    ) {
      return;
    }
    if (desired.brightness !== undefined && !current.dimmable) {
      return;
    }
    if (desired.color !== undefined && !current.colorCapable) {
      return;
    }
    createCommand(card, desired); // Validate before changing any visible state.
    this.versions.set(id, (this.versions.get(id) || 0) + 1);
    const queued =
      desired.on === undefined
        ? {
            ...this.inFlight.get(id),
            ...this.queued.get(id),
            ...desired,
            on: desired.brightness !== 0,
          }
        : { ...desired };
    // Choosing a color after dimming to zero means turn on with the remembered brightness.
    if (desired.color && queued.brightness === 0) {
      queued.brightness = current.lastBrightness;
    }
    this.queued.set(id, queued);
    this.replace(applyDesired(current, desired, true));
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
    if (
      this.stopped ||
      !this.active ||
      this.authFailed ||
      this.sending.has(id) ||
      !this.queued.has(id)
    ) {
      return;
    }
    this.sending.add(id);
    const desired = this.queued.get(id)!;
    this.queued.delete(id);
    const version = this.versions.get(id);
    const { generation } = this;
    this.inFlight.set(id, desired);
    try {
      const card = this.page.cards.find((item) => item.entityId === id)!;
      await this.api.callService(createCommand(card, desired));
      if (this.stopped || !this.active || this.authFailed || this.generation !== generation) {
        return;
      }
      // A successful service call acknowledges this intent. Keep it visible until the
      // next normal poll, since device transitions can lag behind the HTTP response.
      const previous =
        this.confirmed.get(id) || this.snapshot.devices.find((item) => item.id === id)!;
      const accepted = applyDesired(previous, desired, false);
      this.confirmed.set(id, accepted);
      if (this.versions.get(id) === version && !this.queued.has(id)) {
        this.replace(accepted);
        this.emit({
          actionFailure:
            this.snapshot.actionFailure?.entityId === id ? null : this.snapshot.actionFailure,
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      if (this.stopped || this.generation !== generation) {
        return;
      }
      const status = error instanceof HomeAssistantError ? error.status : 0;
      const unavailable = status === 401 || status === 403 || status === 404;
      if (unavailable || this.versions.get(id) === version) {
        clearTimeout(this.timers.get(id));
        this.timers.delete(id);
        this.queued.delete(id);
        if (unavailable) {
          const message = this.fail(id, error);
          if (this.authFailed) {
            this.emit({ error: message });
          }
        } else {
          const previous = this.confirmed.get(id)!;
          this.replace({ ...previous, pending: false });
        }
      }
      const { name } = this.page.cards.find((item) => item.entityId === id)!;
      this.emit({
        actionFailure: {
          entityId: id,
          message: `Couldn’t update ${name}.`,
          sequence: ++this.failureSequence,
        },
      });
    } finally {
      this.sending.delete(id);
      this.inFlight.delete(id);
      if (!this.stopped && this.queued.has(id) && !this.timers.has(id)) {
        void this.flush(id);
      }
    }
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.pollTimer);
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.queued.clear();
    this.inFlight.clear();
    this.api.abort();
    this.listeners.clear();
  }
}
