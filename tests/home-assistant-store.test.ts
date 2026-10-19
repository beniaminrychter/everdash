import assert from 'node:assert/strict';
import test from 'node:test';
import { HomeAssistantStore } from '../src/features/accessories/data/store';
import { HomeAssistantError } from '../src/shared/home-assistant/client';
import type { HomeAssistantApi } from '../src/shared/home-assistant/client';
import { homePage } from './fixtures/home';
import type { ServiceCommand } from '../src/shared/home-assistant/contracts';

const lightId = homePage.cards[0].entityId;
const outletId = homePage.cards[1].entityId;
const state = (id: string, on = true, brightness = 204) => ({
  attributes: { brightness, supported_color_modes: ['brightness'] },
  entity_id: id,
  state: on ? 'on' : 'off',
});
const waitFor = async (condition: () => boolean) => {
  const deadline = Date.now() + 1000;
  while (!condition()) {
    assert.ok(Date.now() < deadline, 'Timed out');
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
};

function setup(overrides: Partial<HomeAssistantApi> = {}, interval = 5000) {
  const calls: ServiceCommand[] = [];
  const api: HomeAssistantApi = {
    abort() {},
    callService: async (command) => {
      calls.push(command);
    },
    getState: async (id) => state(id),
    ...overrides,
  };
  const store = new HomeAssistantStore({ ...homePage, pollIntervalMs: interval }, api);
  return { calls, store };
}

test('refresh polls only configured entities and handles missing entities independently', async () => {
  const requested: string[] = [];
  const { store } = setup({
    getState: async (id) => {
      requested.push(id);
      if (id === outletId) {
        throw new HomeAssistantError('Not found', 404);
      }
      return state(id);
    },
  });
  await store.refresh();
  assert.deepEqual(requested, [lightId, outletId]);
  assert.equal(store.getSnapshot().devices[0].availability, 'available');
  assert.equal(store.getSnapshot().devices[1].availability, 'missing');
  store.stop();
});

test('rapid dimming keeps the latest input and sends one debounced command', async () => {
  const { store, calls } = setup();
  await store.refresh();
  store.update(lightId, { brightness: 20 }, 15);
  store.update(lightId, { brightness: 70 }, 15);
  store.update(lightId, { brightness: 35 }, 15);
  assert.equal(store.getSnapshot().devices[0].brightness, 35);
  await waitFor(() => calls.length === 1 && !store.getSnapshot().devices[0].pending);
  assert.equal(calls[0].data.brightness_pct, 35);
  store.stop();
});

test('an old poll cannot overwrite a command or its confirmed response', async () => {
  let finish: ((value: unknown) => void) | undefined;
  let slow = false;
  let confirmedOn = true;
  const { store } = setup({
    callService: async () => {
      confirmedOn = false;
      slow = false;
    },
    getState: (id) =>
      slow && id === lightId
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : Promise.resolve(state(id, confirmedOn)),
  });
  await store.refresh();
  slow = true;
  const poll = store.refresh();
  store.update(lightId, { on: false });
  slow = false;
  await waitFor(() => !store.getSnapshot().devices[0].pending);
  // A late response captured before the user's command must be ignored.
  finish!(state(lightId, true));
  await poll;
  assert.equal(store.getSnapshot().devices[0].on, false);
  store.stop();
});

test('commands serialize per entity and keep the latest queued brightness', async () => {
  const calls: ServiceCommand[] = [];
  let release: (() => void) | undefined;
  const { store } = setup({
    callService: (command) => {
      calls.push(command);
      return calls.length === 1
        ? new Promise((resolve) => {
            release = resolve;
          })
        : Promise.resolve();
    },
  });
  await store.refresh();
  store.update(lightId, { brightness: 20 });
  store.update(lightId, { brightness: 40 });
  store.update(lightId, { brightness: 60 });
  assert.equal(calls.length, 1);
  release!();
  await waitFor(() => calls.length === 2 && !store.getSnapshot().devices[0].pending);
  assert.deepEqual(
    calls.map((call) => call.data.brightness_pct),
    [20, 60],
  );
  store.stop();
});

test('failed commands report the error and never claim success', async () => {
  const { store } = setup({
    callService: async () => {
      throw new HomeAssistantError('Rejected', 401);
    },
  });
  await store.refresh();
  store.update(lightId, { on: false });
  await waitFor(() => !store.getSnapshot().devices[0].pending);
  assert.equal(store.getSnapshot().devices[0].on, true);
  assert.equal(store.getSnapshot().devices[0].availability, 'error');
  assert.match(store.getSnapshot().error!, /Rejected/);
  store.stop();
});

test('stopping cancels queued controls and late responses cannot update subscribers', async () => {
  const { store, calls } = setup();
  await store.refresh();
  store.update(lightId, { brightness: 30 }, 15);
  let changes = 0;
  store.subscribe(() => changes++);
  store.stop();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(calls.length, 0);
  assert.equal(changes, 0);
});

test('polling pauses in the background, resumes immediately, and cleans up on stop', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let reads = 0;
  const { store } = setup({
    getState: async (id) => {
      reads++;
      return state(id);
    },
  });
  store.start();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reads, 2);
  t.mock.timers.tick(5000);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reads, 4);
  store.setActive(false);
  t.mock.timers.tick(15_000);
  assert.equal(reads, 4);
  store.setActive(true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reads, 6);
  store.stop();
  t.mock.timers.tick(15_000);
  assert.equal(reads, 6);
});

test('authentication failures stop automatic retries until an explicit refresh', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let reads = 0;
  const { store } = setup({
    getState: async () => {
      reads++;
      throw new HomeAssistantError('Invalid token', 401);
    },
  });
  store.start();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reads, 2);
  t.mock.timers.tick(15_000);
  assert.equal(reads, 2);
  await store.refresh();
  assert.equal(reads, 4);
  store.stop();
});

test('pausing cancels debounced controls instead of sending them while disconnected', async () => {
  const { store, calls } = setup();
  await store.refresh();
  store.update(lightId, { brightness: 30 }, 15);
  store.setActive(false);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(calls.length, 0);
  assert.equal(store.getSnapshot().devices[0].pending, false);
  assert.equal(store.getSnapshot().devices[0].brightness, 80);
  store.stop();
});

test('auth failure cancels queued controls and late successful polls stay disabled', async () => {
  let late: ((value: unknown) => void) | undefined;
  let failAuth = false;
  const { store, calls } = setup({
    getState: (id) => {
      if (!failAuth) {
        return Promise.resolve(state(id));
      }
      return id === lightId
        ? new Promise((resolve) => {
            late = resolve;
          })
        : Promise.reject(new HomeAssistantError('Invalid token', 401));
    },
  });
  await store.refresh();
  failAuth = true;
  const poll = store.refresh();
  await new Promise((resolve) => setImmediate(resolve));
  late!(state(lightId));
  await poll;
  assert.ok(store.getSnapshot().devices.every((device) => device.availability === 'error'));
  assert.match(store.getSnapshot().error!, /Invalid token/);
  assert.equal(calls.length, 0);
  store.stop();
});

test('an auth failure cancels another entity’s queued command', async () => {
  let failAuth = false;
  const { store, calls } = setup({
    getState: async (id) => {
      if (failAuth && id === outletId) {
        throw new HomeAssistantError('Invalid token', 401);
      }
      return state(id);
    },
  });
  await store.refresh();
  store.update(lightId, { brightness: 30 }, 15);
  failAuth = true;
  await store.refresh();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(calls.length, 0);
  assert.ok(
    store
      .getSnapshot()
      .devices.every((device) => !device.pending && device.availability === 'error'),
  );
  assert.match(store.getSnapshot().error!, /Invalid token/);
  store.stop();
});

test('choosing a color after queued zero brightness turns the light on with that color', async () => {
  const { store, calls } = setup({
    getState: async (id) => ({
      ...state(id),
      attributes: { brightness: 204, supported_color_modes: ['rgb'] },
    }),
  });
  await store.refresh();
  store.update(lightId, { brightness: 0 }, 15);
  store.update(lightId, { color: '#ff0000' }, 15);
  await waitFor(() => calls.length === 1 && !store.getSnapshot().devices[0].pending);
  assert.equal(calls[0].service, 'turn_on');
  assert.deepEqual(calls[0].data.rgb_color, [255, 0, 0]);
  store.stop();
});

test('failed actions roll back without disconnecting the device and can be retried immediately', async () => {
  let reject: ((reason: Error) => void) | undefined;
  let failing = true;
  const { store } = setup({
    callService: () =>
      failing
        ? new Promise((_resolve, no) => {
            reject = no;
          })
        : Promise.resolve(),
  });
  await store.refresh();
  store.update(lightId, { on: false });
  assert.equal(store.getSnapshot().devices[0].on, false);
  reject!(new HomeAssistantError('Service failed', 500));
  await waitFor(() => !store.getSnapshot().devices[0].pending);
  assert.equal(store.getSnapshot().devices[0].on, true);
  assert.equal(store.getSnapshot().devices[0].availability, 'available');
  assert.equal(store.getSnapshot().error, null);
  assert.match(store.getSnapshot().actionFailure!.message, /Salon Dodatkowe/);
  failing = false;
  store.update(lightId, { on: false });
  assert.equal(store.getSnapshot().devices[0].on, false);
  await waitFor(() => !store.getSnapshot().devices[0].pending);
  assert.equal(store.getSnapshot().devices[0].on, false);
  assert.equal(store.getSnapshot().actionFailure, null);
  store.stop();
});

test('an older failed request preserves the latest queued input', async () => {
  const calls: ServiceCommand[] = [];
  let reject: ((reason: Error) => void) | undefined;
  const { store } = setup({
    callService: (command) => {
      calls.push(command);
      return calls.length === 1
        ? new Promise((_resolve, no) => {
            reject = no;
          })
        : Promise.resolve();
    },
  });
  await store.refresh();
  store.update(lightId, { brightness: 20 });
  store.update(lightId, { brightness: 60 });
  assert.equal(store.getSnapshot().devices[0].brightness, 60);
  reject!(new HomeAssistantError('Temporary failure', 500));
  await waitFor(() => calls.length === 2 && !store.getSnapshot().devices[0].pending);
  assert.equal(store.getSnapshot().devices[0].brightness, 60);
  assert.equal(calls[1].data.brightness_pct, 60);
  assert.equal(store.getSnapshot().actionFailure, null);
  store.stop();
});

test('a later failed action restores the preceding successful action', async () => {
  let finish: (() => void) | undefined;
  let count = 0;
  const { store } = setup({
    callService: () =>
      ++count === 1
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : Promise.reject(new HomeAssistantError('Failed', 500)),
  });
  await store.refresh();
  store.update(lightId, { brightness: 20 });
  store.update(lightId, { brightness: 60 });
  finish!();
  await waitFor(() => count === 2 && !store.getSnapshot().devices[0].pending);
  assert.equal(store.getSnapshot().devices[0].brightness, 20);
  assert.equal(store.getSnapshot().devices[0].availability, 'available');
  store.stop();
});

test('queued colors retain a pending brightness even when the first request fails', async () => {
  const calls: ServiceCommand[] = [];
  let reject: ((reason: Error) => void) | undefined;
  const { store } = setup({
    callService: (command) => {
      calls.push(command);
      return calls.length === 1
        ? new Promise((_resolve, no) => {
            reject = no;
          })
        : Promise.resolve();
    },
    getState: async (id) => ({
      ...state(id),
      attributes: { brightness: 204, supported_color_modes: ['rgb'] },
    }),
  });
  await store.refresh();
  store.update(lightId, { brightness: 20 });
  store.update(lightId, { color: '#ff0000' });
  reject!(new HomeAssistantError('Failed', 500));
  await waitFor(() => calls.length === 2 && !store.getSnapshot().devices[0].pending);
  assert.equal(calls[1].data.brightness_pct, 20);
  assert.deepEqual(calls[1].data.rgb_color, [255, 0, 0]);
  assert.equal(store.getSnapshot().devices[0].brightness, 20);
  assert.equal(store.getSnapshot().devices[0].color, '#ff0000');
  store.stop();
});

test('a failure from before a pause cannot roll back a newly queued action', async () => {
  let reject: ((reason: Error) => void) | undefined;
  let count = 0;
  const { store } = setup({
    callService: () =>
      ++count === 1
        ? new Promise((_resolve, no) => {
            reject = no;
          })
        : Promise.resolve(),
  });
  await store.refresh();
  store.update(lightId, { brightness: 20 });
  store.setActive(false);
  store.setActive(true);
  store.update(lightId, { brightness: 70 });
  reject!(new HomeAssistantError('Old failure', 500));
  await waitFor(() => count === 2 && !store.getSnapshot().devices[0].pending);
  assert.equal(store.getSnapshot().devices[0].brightness, 70);
  assert.equal(store.getSnapshot().actionFailure, null);
  store.stop();
});

test('a pending off command cannot turn a later brightness or color action off', async () => {
  for (const desired of [{ brightness: 45 }, { color: '#ff0000' }]) {
    const calls: ServiceCommand[] = [];
    let release: (() => void) | undefined;
    const { store } = setup({
      callService: (command) => {
        calls.push(command);
        return calls.length === 1
          ? new Promise((resolve) => {
              release = resolve;
            })
          : Promise.resolve();
      },
      getState: async (id) => ({
        ...state(id),
        attributes: { brightness: 204, supported_color_modes: ['rgb'] },
      }),
    });
    await store.refresh();
    store.update(lightId, { on: false });
    store.update(lightId, desired);
    assert.equal(store.getSnapshot().devices[0].on, true);
    release!();
    await waitFor(() => calls.length === 2 && !store.getSnapshot().devices[0].pending);
    assert.equal(calls[1].service, 'turn_on');
    assert.equal(store.getSnapshot().devices[0].on, true);
    store.stop();
  }
});

test('poll responses and authentication errors from before a pause are ignored', async () => {
  for (const fails of [false, true]) {
    let slow = false;
    let finish: ((value: unknown) => void) | undefined;
    let reject: ((reason: Error) => void) | undefined;
    const { store, calls } = setup({
      getState: (id) =>
        slow && id === lightId
          ? new Promise((yes, no) => {
              finish = yes;
              reject = no;
            })
          : Promise.resolve(state(id)),
    });
    await store.refresh();
    slow = true;
    const poll = store.refresh();
    store.setActive(false);
    slow = false;
    if (fails) {
      reject!(new HomeAssistantError('Old authentication error', 401));
    } else {
      finish!(state(lightId, false));
    }
    await poll;
    assert.equal(store.getSnapshot().devices[0].on, true);
    assert.equal(store.getSnapshot().devices[0].availability, 'available');
    assert.equal(store.getSnapshot().error, null);
    store.setActive(true);
    store.update(lightId, { brightness: 45 });
    await waitFor(() => calls.length === 1 && !store.getSnapshot().devices[0].pending);
    store.stop();
  }
});
