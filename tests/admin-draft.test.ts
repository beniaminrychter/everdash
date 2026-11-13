import assert from 'node:assert/strict';
import test from 'node:test';
import type { DashboardDocument } from '@everdash/contracts/config/types';
import {
  draftIssues,
  draftReducer,
  initialDraft,
  isDirty,
} from '../apps/admin/src/app/draft/draftReducer';
import type { DraftAction, DraftState } from '../apps/admin/src/app/draft/draftReducer';

const fixture: DashboardDocument = {
  schemaVersion: 1,
  polling: { controlsMs: 2000, observationsMs: 30000, metadataMs: 60000 },
  views: [
    {
      id: 'home',
      title: 'Home',
      cards: [
        { type: 'light', entity: 'light.hall' },
        { type: 'outlet', entity: 'switch.lamp' },
      ],
      badges: [{ type: 'temperature', entity: 'sensor.outside' }],
    },
    { id: 'office', title: 'Office', cards: [], badges: [] },
  ],
};

function start(): DraftState {
  return initialDraft(structuredClone(fixture));
}

function run(state: DraftState, ...actions: DraftAction[]): DraftState {
  return actions.reduce(draftReducer, state);
}

test('start-card + commit-pending appends the card and selects it', () => {
  const initial = start();
  const length = initial.document.views[0]!.cards!.length;
  const pending = draftReducer(initial, { type: 'start-card', kind: 'light' });

  assert.equal(pending.document.views[0]!.cards!.length, length);
  assert.equal(pending.selection.kind, 'pending-card');

  const committed = run(
    pending,
    { type: 'update-pending', value: { type: 'light', entity: 'light.kitchen' } },
    { type: 'commit-pending' },
  );

  assert.equal(committed.document.views[0]!.cards!.length, length + 1);
  assert.deepEqual(committed.selection, { kind: 'card', index: length });
  assert.equal(committed.document.views[0]!.cards![length]!.entity, 'light.kitchen');
});

test('commit-pending without an entity is a no-op', () => {
  const pending = draftReducer(start(), { type: 'start-card', kind: 'light' });

  assert.equal(draftReducer(pending, { type: 'commit-pending' }), pending);
});

test('commit-pending commits a badge with a valid sensor', () => {
  const state = run(
    start(),
    { type: 'start-badge' },
    { type: 'update-pending', value: { type: 'temperature', entity: 'sensor.kitchen' } },
    { type: 'commit-pending' },
  );

  assert.equal(state.document.views[0]!.badges!.length, 2);
  assert.deepEqual(state.selection, { kind: 'badge', index: 1 });
});

test('pending card is not part of the document until committed', () => {
  const state = draftReducer(start(), { type: 'start-card', kind: 'light' });

  assert.equal(isDirty(state), false);
});

test('ignores canvas selection from an old generation', () => {
  const state = start();
  const base = { type: 'everdash.editor.card.edit', viewId: 'home', index: 0 };

  const stale = draftReducer(state, {
    type: 'canvas-message',
    message: { ...base, generation: state.generation - 1 },
  });
  assert.deepEqual(stale.selection, state.selection);

  const current = draftReducer(state, {
    type: 'canvas-message',
    message: { ...base, generation: state.generation },
  });
  assert.deepEqual(current.selection, { kind: 'card', index: 0 });
});

test('canvas messages with a wrong view or out-of-range index are ignored', () => {
  const state = start();
  const send = (message: Record<string, unknown>) =>
    draftReducer(state, {
      type: 'canvas-message',
      message: { generation: state.generation, ...message },
    });

  assert.equal(send({ type: 'everdash.editor.card.edit', viewId: 'office', index: 0 }), state);
  assert.equal(send({ type: 'everdash.editor.card.edit', viewId: 'home', index: 9 }), state);
  assert.equal(send({ type: 'everdash.editor.card.edit', viewId: 'home', index: -1 }), state);
  assert.equal(send({ type: 'everdash.editor.card.edit', viewId: 'home', index: 0.5 }), state);
  assert.equal(draftReducer(state, { type: 'canvas-message', message: 'nope' }), state);
});

test('canvas can select a view, edit a badge, and move a card', () => {
  const state = start();
  const generation = state.generation;

  const view = draftReducer(state, {
    type: 'canvas-message',
    message: { type: 'everdash.editor.view.select', generation, viewId: 'office' },
  });
  assert.equal(view.viewId, 'office');

  const badge = draftReducer(state, {
    type: 'canvas-message',
    message: { type: 'everdash.editor.badge.edit', generation, viewId: 'home', index: 0 },
  });
  assert.deepEqual(badge.selection, { kind: 'badge', index: 0 });

  const moved = draftReducer(state, {
    type: 'canvas-message',
    message: { type: 'everdash.editor.card.move', generation, viewId: 'home', index: 0, offset: 1 },
  });
  assert.equal(moved.document.views[0]!.cards![1]!.entity, 'light.hall');
  assert.equal(moved.generation, generation + 1);
});

test('canvas delete messages select the item and never delete it', () => {
  const state = start();
  const generation = state.generation;

  const card = draftReducer(state, {
    type: 'canvas-message',
    message: { type: 'everdash.editor.card.delete', generation, viewId: 'home', index: 1 },
  });
  assert.deepEqual(card.selection, { kind: 'card', index: 1 });
  assert.equal(card.document, state.document);

  const badge = draftReducer(state, {
    type: 'canvas-message',
    message: { type: 'everdash.editor.badge.delete', generation, viewId: 'home', index: 0 },
  });
  assert.deepEqual(badge.selection, { kind: 'badge', index: 0 });
  assert.equal(badge.document, state.document);
});

test('delete-card resets selection', () => {
  const state = run(
    start(),
    { type: 'select', selection: { kind: 'card', index: 1 } },
    { type: 'delete-card', index: 1 },
  );

  assert.equal(state.selection.kind, 'view');
  assert.equal(state.document.views[0]!.cards!.length, 1);
});

test('move-card keeps the moved card selected', () => {
  const state = run(
    start(),
    { type: 'select', selection: { kind: 'card', index: 0 } },
    { type: 'move-card', index: 0, offset: 1 },
  );

  assert.deepEqual(state.selection, { kind: 'card', index: 1 });
});

test('delete-view is refused for the last view', () => {
  const single = initialDraft({
    schemaVersion: 1,
    views: [{ id: 'only', title: 'Only', cards: [], badges: [] }],
  });

  assert.equal(draftReducer(single, { type: 'delete-view' }), single);
  assert.equal(draftReducer(start(), { type: 'delete-view' }).document.views.length, 1);
});

test('select-view to an unknown id falls back to the first view', () => {
  const state = run(
    start(),
    { type: 'select-view', viewId: 'office' },
    { type: 'select-view', viewId: 'missing' },
  );

  assert.equal(state.viewId, 'home');
});

test('add-view creates a unique view and selects it', () => {
  const state = draftReducer(start(), { type: 'add-view' });

  assert.equal(state.document.views.length, 3);
  assert.equal(state.viewId, state.document.views[2]!.id);
  assert.equal(state.document.views[2]!.title, 'New view');
  assert.equal(new Set(state.document.views.map((view) => view.id)).size, 3);
});

test('discard restores baseline and clears changes', () => {
  const edited = run(start(), { type: 'rename-view', title: 'Renamed' });
  assert.equal(isDirty(edited), true);
  assert.equal(edited.changes, 1);

  const discarded = draftReducer(edited, { type: 'discard' });
  assert.equal(isDirty(discarded), false);
  assert.equal(discarded.changes, 0);
  assert.equal(discarded.document.views[0]!.title, 'Home');
  assert.ok(discarded.generation > edited.generation);
});

test('generation increases on every document change', () => {
  let state = start();
  const actions: DraftAction[] = [
    { type: 'rename-view', title: 'A' },
    { type: 'replace', document: structuredClone(fixture) },
    { type: 'discard' },
    { type: 'loaded', document: structuredClone(fixture), revision: 'r1' },
    { type: 'saved', document: structuredClone(fixture), revision: 'r2' },
  ];

  for (const action of actions) {
    const next = draftReducer(state, action);
    assert.ok(next.generation > state.generation, action.type);
    state = next;
  }
  assert.equal(state.revision, 'r2');
});

test('saved keeps selection and view; loaded resets selection', () => {
  const edited = run(
    start(),
    { type: 'rename-view', title: 'Lobby' },
    { type: 'select', selection: { kind: 'card', index: 1 } },
  );

  const saved = draftReducer(edited, {
    type: 'saved',
    document: edited.document,
    revision: 'r2',
  });

  assert.equal(saved.viewId, 'home');
  assert.deepEqual(saved.selection, { kind: 'card', index: 1 });
  assert.equal(saved.changes, 0);
  assert.equal(saved.revision, 'r2');
  assert.equal(isDirty(saved), false);
  assert.ok(saved.generation > edited.generation);

  const loaded = draftReducer(edited, {
    type: 'loaded',
    document: edited.document,
    revision: 'r3',
  });

  assert.deepEqual(loaded.selection, { kind: 'view' });
});

test('editing back keeps changes above zero but is not dirty', () => {
  const state = run(
    start(),
    { type: 'rename-view', title: 'Other' },
    { type: 'rename-view', title: 'Home' },
  );

  assert.equal(isDirty(state), false);
  assert.equal(state.changes, 2);
});

test('update-home merges polling', () => {
  const state = draftReducer(start(), {
    type: 'update-home',
    home: { polling: { controlsMs: 5000 } },
  });

  assert.deepEqual(state.document.polling, {
    controlsMs: 5000,
    observationsMs: 30000,
    metadataMs: 60000,
  });
});

test('draftIssues reports validation problems and is empty when valid', () => {
  assert.deepEqual(draftIssues(start()), []);

  const broken = draftReducer(start(), {
    type: 'update-card',
    index: 0,
    card: { type: 'light', entity: 'nope' as 'light.x' },
  });
  assert.ok(draftIssues(broken).length > 0);
});
