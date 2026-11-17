import assert from 'node:assert/strict';
import test from 'node:test';
import type { DashboardDocument } from '@everdash/contracts/config/types';
import {
  draftIssues,
  draftReducer,
  initialDraft,
  isDirty,
  serializeDocument,
  unfinishedCardIssue,
} from '../apps/admin/src/app/draft/draftReducer';
import {
  hasIncomplete,
  isIncomplete,
  withoutIncomplete,
  withoutMarkers,
} from '../apps/admin/src/app/draft/incomplete';
import type {
  CardLocation,
  DraftAction,
  DraftState,
} from '../apps/admin/src/app/draft/draftReducer';

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

function canvas(state: DraftState, message: Record<string, unknown>): DraftAction {
  return {
    type: 'canvas-message',
    message: { generation: state.generation, viewId: 'home', ...message },
  };
}

function homeCards(state: DraftState): string[] {
  return state.document.views[0]!.cards!.map((card) => card.entity);
}

const sectionFixture: DashboardDocument = {
  schemaVersion: 1,
  views: [
    {
      id: 'home',
      title: 'Home',
      cards: [
        { type: 'light', entity: 'light.hall' },
        { type: 'outlet', entity: 'switch.lamp' },
      ],
      sections: [
        {
          id: 'kitchen',
          title: 'Kitchen',
          cards: [
            { type: 'light', entity: 'light.island' },
            { type: 'light', entity: 'light.sink' },
          ],
        },
        { id: 'garden', title: 'Garden', cards: [] },
      ],
    },
  ],
};

function startSections(): DraftState {
  return initialDraft(structuredClone(sectionFixture));
}

const view = (state: DraftState) => state.document.views[0]!;
const selectCard = (state: DraftState, section: string | null, index: number): DraftState =>
  draftReducer(state, {
    type: 'select',
    selection: section === null ? { kind: 'card', index } : { kind: 'card', section, index },
  });
const sectionIds = (state: DraftState) => (view(state).sections ?? []).map((item) => item.id);
const sectionCards = (state: DraftState, id: string) =>
  (view(state).sections ?? []).find((item) => item.id === id)!.cards!.map((card) => card.entity);

const incompleteFlags = (state: DraftState) => state.document.views[0]!.cards!.map(isIncomplete);

/** Adds a finished light card the way the editor does: start it, pick an entity, finish it. */
function addLight(state: DraftState, entity: string, section: string | null = null): DraftState {
  const started = draftReducer(state, { type: 'start-card', kind: 'light', section });
  const { index } = started.selection as { index: number };

  return run(
    started,
    { type: 'update-card', section, index, card: { type: 'light', entity } },
    { type: 'finish-card', section, index },
  );
}

test('start-card adds an incomplete card at the end of the list and selects it', () => {
  const initial = start();
  const length = initial.document.views[0]!.cards!.length;
  const started = draftReducer(initial, { type: 'start-card', kind: 'light' });
  const cards = started.document.views[0]!.cards!;

  assert.equal(cards.length, length + 1);
  assert.equal(isIncomplete(cards[length]!), true);
  assert.deepEqual(started.selection, { kind: 'card', index: length });
  assert.equal(hasIncomplete(started.document), true);

  const edited = draftReducer(started, {
    type: 'update-card',
    index: length,
    card: { type: 'light', entity: 'light.kitchen' },
  });

  // Editing a new card keeps it new; only finishing it makes it an ordinary card.
  assert.equal(isIncomplete(edited.document.views[0]!.cards![length]!), true);

  const finished = draftReducer(edited, { type: 'finish-card', index: length });

  assert.equal(finished.document.views[0]!.cards!.length, length + 1);
  assert.deepEqual(finished.document.views[0]!.cards![length], {
    type: 'light',
    entity: 'light.kitchen',
  });
  assert.deepEqual(finished.selection, { kind: 'card', index: length });
  assert.equal(hasIncomplete(finished.document), false);
});

test('a clock card can be added without choosing an entity', () => {
  const initial = start();
  const length = initial.document.views[0]!.cards!.length;
  const started = draftReducer(initial, { type: 'start-card', kind: 'clock' });

  assert.deepEqual(started.document.views[0]!.cards![length], { type: 'clock', incomplete: true });

  const finished = draftReducer(started, { type: 'finish-card', index: length });

  assert.equal(finished.document.views[0]!.cards!.length, length + 1);
  assert.deepEqual(finished.document.views[0]!.cards![length], { type: 'clock' });
  assert.deepEqual(draftIssues(finished), []);
});

test('finish-card without an entity is a no-op', () => {
  const started = draftReducer(start(), { type: 'start-card', kind: 'light' });
  const { index } = started.selection as { index: number };

  assert.equal(draftReducer(started, { type: 'finish-card', index }), started);
  // Finishing a card that was never new, or one that does not exist, changes nothing either.
  assert.equal(draftReducer(started, { type: 'finish-card', index: 0 }), started);
  assert.equal(draftReducer(started, { type: 'finish-card', index: 9 }), started);
});

test('commit-pending without a sensor is a no-op for a badge', () => {
  const pending = draftReducer(start(), { type: 'start-badge' });

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

test('a new card is a draft change that blocks saving until it is finished or removed', () => {
  const started = draftReducer(start(), { type: 'start-card', kind: 'light' });

  assert.equal(isDirty(started), true);
  assert.equal(unfinishedCardIssue(started), 'Finish or remove the new card before saving.');
  assert.deepEqual(draftIssues(started), ['Finish or remove the new card before saving.']);

  // The rest of the dashboard is checked as it will be saved, with the new card left out.
  assert.deepEqual(
    withoutIncomplete(started.document).views[0]!.cards,
    start().document.views[0]!.cards,
  );
  assert.deepEqual(
    JSON.parse(serializeDocument(withoutMarkers(withoutIncomplete(started.document)))),
    JSON.parse(serializeDocument(start().document)),
  );

  const broken = draftReducer(started, {
    type: 'update-home',
    home: { timeZone: 'Not/AZone' },
  });

  assert.equal(draftIssues(broken).length >= 2, true);

  const removed = draftReducer(started, { type: 'delete-card', index: 2 });

  assert.deepEqual(draftIssues(removed), []);
  assert.equal(isDirty(removed), false);
});

test('the save gate names the view that holds the unfinished card', () => {
  const started = run(
    start(),
    { type: 'start-card', kind: 'light' },
    { type: 'select-view', viewId: 'office' },
  );

  assert.equal(
    unfinishedCardIssue(started),
    'Finish or remove the new card in “Home” before saving.',
  );
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

const badge = (entity: string, name?: string) => ({
  type: 'temperature' as const,
  entity: entity as `sensor.${string}`,
  ...(name ? { name } : {}),
});

function badgeState(...badges: ReturnType<typeof badge>[]): DraftState {
  return initialDraft({
    ...structuredClone(fixture),
    views: [{ id: 'home', title: 'Home', cards: [], badges }],
  });
}

const badgeOrder = (state: DraftState) =>
  state.document.views[0]!.badges!.map((item) => item.name ?? item.entity);

test('a canvas duplicate puts a copy of the badge after it and selects the copy', () => {
  const state = badgeState(badge('sensor.a'), badge('sensor.b'), badge('sensor.c'));
  const copied = draftReducer(
    state,
    canvas(state, { type: 'everdash.editor.badge.duplicate', index: 0 }),
  );
  const badges = copied.document.views[0]!.badges!;

  assert.deepEqual(badgeOrder(copied), ['sensor.a', 'sensor.a', 'sensor.b', 'sensor.c']);
  assert.deepEqual(badges[1], badges[0]);
  assert.notEqual(badges[1], badges[0]);
  assert.deepEqual(copied.selection, { kind: 'badge', index: 1 });
  assert.equal(copied.generation, state.generation + 1);
});

test('a canvas move reorders badges by offset or to an index and selects the moved badge', () => {
  const state = badgeState(badge('sensor.a'), badge('sensor.b'), badge('sensor.c'));
  const byOffset = draftReducer(
    state,
    canvas(state, { type: 'everdash.editor.badge.move', index: 0, offset: 1 }),
  );

  assert.deepEqual(badgeOrder(byOffset), ['sensor.b', 'sensor.a', 'sensor.c']);
  assert.deepEqual(byOffset.selection, { kind: 'badge', index: 1 });
  assert.equal(byOffset.generation, state.generation + 1);

  const toIndex = draftReducer(
    state,
    canvas(state, { type: 'everdash.editor.badge.move', index: 0, to: 2 }),
  );

  assert.deepEqual(badgeOrder(toIndex), ['sensor.b', 'sensor.c', 'sensor.a']);
  assert.deepEqual(toIndex.selection, { kind: 'badge', index: 2 });

  for (const message of [
    { index: 0, offset: -1 },
    { index: 2, offset: 1 },
    { index: 0, to: 9 },
    { index: 0, to: 0 },
    { index: 9, offset: 1 },
    { index: 0, to: 1.5 },
    { index: 0 },
  ]) {
    assert.equal(
      draftReducer(state, canvas(state, { type: 'everdash.editor.badge.move', ...message })),
      state,
    );
  }
});

test('badges on the same entity keep their own place when duplicated and moved', () => {
  const state = badgeState(badge('sensor.a', 'first'), badge('sensor.a', 'second'));
  const copied = draftReducer(
    state,
    canvas(state, { type: 'everdash.editor.badge.duplicate', index: 0 }),
  );

  assert.deepEqual(badgeOrder(copied), ['first', 'first', 'second']);

  const moved = draftReducer(
    copied,
    canvas(copied, { type: 'everdash.editor.badge.move', index: 2, to: 0 }),
  );

  assert.deepEqual(badgeOrder(moved), ['second', 'first', 'first']);
});

test('a badge that is still being added survives a canvas move', () => {
  const state = draftReducer(badgeState(badge('sensor.a'), badge('sensor.b')), {
    type: 'start-badge',
  });
  const moved = draftReducer(
    state,
    canvas(state, { type: 'everdash.editor.badge.move', index: 0, offset: 1 }),
  );

  assert.deepEqual(badgeOrder(moved), ['sensor.b', 'sensor.a']);
  assert.equal(moved.selection.kind, 'pending-badge');
});

test('the move-badge and duplicate-badge actions do what the canvas messages do', () => {
  const state = badgeState(badge('sensor.a'), badge('sensor.b'));
  const moved = draftReducer(state, { type: 'move-badge', index: 0, to: 1 });
  const copied = draftReducer(state, { type: 'duplicate-badge', index: 1 });

  assert.deepEqual(badgeOrder(moved), ['sensor.b', 'sensor.a']);
  assert.deepEqual(badgeOrder(copied), ['sensor.a', 'sensor.b', 'sensor.b']);
  assert.deepEqual(copied.selection, { kind: 'badge', index: 2 });
  assert.equal(draftReducer(state, { type: 'move-badge', index: 0, to: 5 }), state);
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

test('a canvas delete of a new card removes it at once, with nothing to confirm', () => {
  const started = draftReducer(start(), { type: 'start-card', kind: 'light' });
  const deleted = draftReducer(
    started,
    canvas(started, { type: 'everdash.editor.card.delete', index: 2 }),
  );

  assert.equal(deleted.document.views[0]!.cards!.length, 2);
  assert.equal(hasIncomplete(deleted.document), false);
  assert.deepEqual(deleted.selection, { kind: 'view' });
  assert.deepEqual(draftIssues(deleted), []);
});

test('delete-card resets selection when the selected card is deleted', () => {
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
    {
      type: 'saved',
      document: structuredClone(fixture),
      sent: structuredClone(fixture),
      revision: 'r2',
    },
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
    sent: edited.document,
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

test('edits made during save survive', () => {
  const sent = run(start(), { type: 'rename-view', title: 'Lobby' }).document;
  const during = run(
    { ...start(), document: sent, changes: 1 },
    { type: 'rename-view', title: 'Lobby 2' },
    { type: 'select', selection: { kind: 'card', index: 1 } },
  );

  const saved = draftReducer(during, {
    type: 'saved',
    document: structuredClone(sent),
    sent,
    revision: 'r2',
  });

  assert.equal(saved.document.views[0]!.title, 'Lobby 2');
  assert.equal(saved.revision, 'r2');
  assert.equal(isDirty(saved), true);
  assert.deepEqual(saved.selection, { kind: 'card', index: 1 });
  assert.equal(saved.changes, during.changes);
  assert.equal(saved.generation, during.generation);

  const reverted = draftReducer(saved, { type: 'rename-view', title: 'Lobby' });

  assert.equal(isDirty(reverted), false);
});

test('acting on other cards never makes the new card disappear', () => {
  const started = draftReducer(start(), { type: 'start-card', kind: 'light' });

  // Moving another card, duplicating one, and deleting one all leave the new card in the list.
  const moved = draftReducer(
    started,
    canvas(started, { type: 'everdash.editor.card.move', index: 0, offset: 1 }),
  );

  assert.deepEqual(homeCards(moved).slice(0, 2), ['switch.lamp', 'light.hall']);
  assert.deepEqual(incompleteFlags(moved), [false, false, true]);
  // The new card stays selected: moving another card never steals or shifts the inspector.
  assert.deepEqual(moved.selection, { kind: 'card', index: 2 });

  const duplicated = draftReducer(
    moved,
    canvas(moved, { type: 'everdash.editor.card.duplicate', index: 0 }),
  );

  assert.deepEqual(incompleteFlags(duplicated), [false, false, false, true]);
  assert.deepEqual(duplicated.selection, { kind: 'card', index: 1 });

  const deleted = draftReducer(duplicated, { type: 'delete-card', index: 0 });

  assert.deepEqual(incompleteFlags(deleted), [false, false, true]);

  const edited = draftReducer(
    deleted,
    canvas(deleted, { type: 'everdash.editor.card.edit', index: 0 }),
  );

  assert.deepEqual(incompleteFlags(edited), [false, false, true]);
  assert.deepEqual(edited.selection, { kind: 'card', index: 0 });
});

test('a new card can be dragged within its list, across sections, and deleted from the canvas', () => {
  const started = draftReducer(startSections(), { type: 'start-card', kind: 'light' });

  assert.deepEqual(started.selection, { kind: 'card', index: 2 });

  // Dragged to the front of its list; it is still new and still selected.
  const front = draftReducer(
    started,
    canvas(started, { type: 'everdash.editor.card.move', index: 2, to: 0 }),
  );

  assert.deepEqual(front.selection, { kind: 'card', index: 0 });
  assert.equal(isIncomplete(view(front).cards![0]!), true);

  // Dragged into a section.
  const crossed = draftReducer(
    front,
    canvas(front, {
      type: 'everdash.editor.card.move',
      index: 0,
      toSection: 'kitchen',
      to: 1,
    }),
  );

  assert.deepEqual(crossed.selection, { kind: 'card', section: 'kitchen', index: 1 });
  assert.equal(isIncomplete(view(crossed).sections![0]!.cards![1]!), true);
  assert.equal(unfinishedCardIssue(crossed) !== null, true);
  assert.deepEqual(homeCards(crossed), ['light.hall', 'switch.lamp']);

  // It can be given an entity and finished where it landed.
  const finished = run(
    crossed,
    {
      type: 'update-card',
      section: 'kitchen',
      index: 1,
      card: { type: 'light', entity: 'light.shed' },
    },
    { type: 'finish-card', section: 'kitchen', index: 1 },
  );

  assert.deepEqual(sectionCards(finished, 'kitchen'), ['light.island', 'light.shed', 'light.sink']);
  assert.deepEqual(draftIssues(finished), []);

  // Or deleted from the canvas menu without a confirmation.
  const deleted = draftReducer(
    crossed,
    canvas(crossed, { type: 'everdash.editor.card.delete', section: 'kitchen', index: 1 }),
  );

  assert.deepEqual(sectionCards(deleted, 'kitchen'), ['light.island', 'light.sink']);
  assert.deepEqual(draftIssues(deleted), []);
});

test('a second new card cannot be started while one is unfinished', () => {
  const started = draftReducer(start(), { type: 'start-card', kind: 'light' });

  assert.equal(draftReducer(started, { type: 'start-card', kind: 'outlet' }), started);
  assert.equal(
    draftReducer(started, canvas(started, { type: 'everdash.editor.card.add', section: null })),
    started,
  );
});

test('a new card cannot be duplicated', () => {
  const started = draftReducer(start(), { type: 'start-card', kind: 'light' });

  assert.equal(draftReducer(started, { type: 'duplicate-card', index: 2 }), started);
});

test('a pending badge is kept or committed when another badge is selected', () => {
  const pending = draftReducer(start(), { type: 'start-badge' });
  const kept = draftReducer(
    pending,
    canvas(pending, { type: 'everdash.editor.badge.edit', index: 0 }),
  );

  assert.equal(kept, pending);

  const valid = draftReducer(pending, {
    type: 'update-pending',
    value: { type: 'temperature', entity: 'sensor.kitchen' },
  });
  const committed = draftReducer(
    valid,
    canvas(valid, { type: 'everdash.editor.badge.edit', index: 0 }),
  );

  assert.equal(committed.document.views[0]!.badges!.length, 2);
  assert.deepEqual(committed.selection, { kind: 'badge', index: 0 });
});

test('a card can be moved by any offset or to a target index', () => {
  const initial = start();
  const added = ['light.a', 'light.b'].reduce((state, entity) => addLight(state, entity), initial);
  const four = draftReducer(added, { type: 'select', selection: { kind: 'card', index: 0 } });

  assert.deepEqual(homeCards(four), ['light.hall', 'switch.lamp', 'light.a', 'light.b']);

  const forward = draftReducer(
    four,
    canvas(four, { type: 'everdash.editor.card.move', index: 0, offset: 3 }),
  );

  assert.deepEqual(homeCards(forward), ['switch.lamp', 'light.a', 'light.b', 'light.hall']);
  assert.deepEqual(forward.selection, { kind: 'card', index: 3 });

  const backward = draftReducer(
    forward,
    canvas(forward, { type: 'everdash.editor.card.move', index: 3, offset: -2 }),
  );

  assert.deepEqual(homeCards(backward), ['switch.lamp', 'light.hall', 'light.a', 'light.b']);
  assert.deepEqual(backward.selection, { kind: 'card', index: 1 });

  const target = draftReducer(
    backward,
    canvas(backward, { type: 'everdash.editor.card.move', index: 1, to: 3 }),
  );

  assert.deepEqual(homeCards(target), ['switch.lamp', 'light.a', 'light.b', 'light.hall']);
});

test('a move outside the view or by zero changes nothing', () => {
  const state = start();

  for (const offset of [0, 2, -1, 0.5]) {
    assert.equal(
      draftReducer(state, canvas(state, { type: 'everdash.editor.card.move', index: 0, offset })),
      state,
    );
  }

  assert.equal(draftReducer(state, { type: 'move-card', index: 1, offset: 5 }), state);
});

test('add-section appends a uniquely named empty section and selects it', () => {
  const state = run(start(), { type: 'add-section' }, { type: 'add-section' });
  const sections = view(state).sections!;

  assert.equal(sections.length, 2);
  assert.equal(new Set(sections.map((item) => item.id)).size, 2);
  assert.equal(sections[1]!.title, 'New section');
  assert.deepEqual(sections[1]!.cards, []);
  assert.deepEqual(state.selection, { kind: 'section', id: sections[1]!.id });
  assert.deepEqual(draftIssues(state), []);
  assert.equal(isDirty(state), true);
});

test('a view that never had sections keeps no sections key, also after the last one is deleted', () => {
  const added = draftReducer(start(), { type: 'add-section' });
  const id = view(added).sections![0]!.id;
  const removed = draftReducer(added, { type: 'delete-section', id, cards: 'delete' });

  assert.equal('sections' in view(removed), false);
  assert.equal(isDirty(removed), false);
});

test('rename-section changes the title, and unknown ids change nothing', () => {
  const state = startSections();
  const renamed = draftReducer(state, { type: 'rename-section', id: 'kitchen', title: 'Cooking' });

  assert.equal(view(renamed).sections![0]!.title, 'Cooking');
  assert.equal(view(renamed).sections![0]!.id, 'kitchen');
  assert.equal(draftReducer(state, { type: 'rename-section', id: 'nope', title: 'X' }), state);
  // A blank title is allowed while typing, but the draft reports it.
  const blank = draftReducer(renamed, { type: 'rename-section', id: 'kitchen', title: ' ' });

  assert.ok(draftIssues(blank).some((issue) => issue.includes('sections[0].title')));
});

test('move-section reorders sections, keeps ids and the selection, and stops at the ends', () => {
  const state = run(startSections(), {
    type: 'select',
    selection: { kind: 'section', id: 'garden' },
  });
  const earlier = draftReducer(state, { type: 'move-section', id: 'garden', offset: -1 });

  assert.deepEqual(sectionIds(earlier), ['garden', 'kitchen']);
  assert.deepEqual(earlier.selection, { kind: 'section', id: 'garden' });
  assert.equal(draftReducer(earlier, { type: 'move-section', id: 'garden', offset: -1 }), earlier);
  assert.equal(draftReducer(state, { type: 'move-section', id: 'garden', offset: 1 }), state);
  assert.deepEqual(
    sectionIds(draftReducer(earlier, { type: 'move-section', id: 'garden', offset: 1 })),
    ['kitchen', 'garden'],
  );
});

test('delete-section can delete its cards or move them to the end of the unsectioned cards', () => {
  const state = startSections();
  const deleted = draftReducer(state, { type: 'delete-section', id: 'kitchen', cards: 'delete' });

  assert.deepEqual(sectionIds(deleted), ['garden']);
  assert.deepEqual(homeCards(deleted), ['light.hall', 'switch.lamp']);
  assert.deepEqual(deleted.selection, { kind: 'view' });

  const kept = draftReducer(state, { type: 'delete-section', id: 'kitchen', cards: 'keep' });

  assert.deepEqual(sectionIds(kept), ['garden']);
  assert.deepEqual(homeCards(kept), ['light.hall', 'switch.lamp', 'light.island', 'light.sink']);
  assert.deepEqual(draftIssues(kept), []);
  assert.equal(draftReducer(state, { type: 'delete-section', id: 'nope', cards: 'keep' }), state);
});

test('a card can be moved to a final position in another section, or out of every section', () => {
  const state = startSections();
  const into = draftReducer(selectCard(state, null, 0), {
    type: 'relocate-card',
    from: { section: null, index: 0 },
    to: { section: 'kitchen', index: 1 },
  });

  assert.deepEqual(homeCards(into), ['switch.lamp']);
  assert.deepEqual(sectionCards(into, 'kitchen'), ['light.island', 'light.hall', 'light.sink']);
  assert.deepEqual(into.selection, { kind: 'card', section: 'kitchen', index: 1 });

  const end = draftReducer(state, {
    type: 'relocate-card',
    from: { section: 'kitchen', index: 0 },
    to: { section: 'garden', index: 0 },
  });

  assert.deepEqual(sectionCards(end, 'kitchen'), ['light.sink']);
  assert.deepEqual(sectionCards(end, 'garden'), ['light.island']);

  const out = draftReducer(selectCard(state, 'kitchen', 1), {
    type: 'relocate-card',
    from: { section: 'kitchen', index: 1 },
    to: { section: null, index: 2 },
  });

  assert.deepEqual(homeCards(out), ['light.hall', 'switch.lamp', 'light.sink']);
  assert.deepEqual(out.selection, { kind: 'card', index: 2 });
  assert.deepEqual(draftIssues(out), []);
  // Moving a card that is not selected leaves the selection where it was.
  assert.deepEqual(end.selection, { kind: 'view' });
});

test('moving a card keeps the selected card selected, wherever it ends up', () => {
  const state = selectCard(startSections(), 'kitchen', 1);
  const move = (from: CardLocation, to: CardLocation) =>
    draftReducer(state, { type: 'relocate-card', from, to });

  // Another card is taken out ahead of it, and put in behind it, in the same list.
  assert.deepEqual(
    move({ section: 'kitchen', index: 0 }, { section: 'kitchen', index: 1 }).selection,
    {
      kind: 'card',
      section: 'kitchen',
      index: 0,
    },
  );
  // Another card is put in ahead of it from another list.
  assert.deepEqual(move({ section: null, index: 0 }, { section: 'kitchen', index: 0 }).selection, {
    kind: 'card',
    section: 'kitchen',
    index: 2,
  });
  // Another card behind it, or in another list, does not change it.
  assert.deepEqual(move({ section: null, index: 0 }, { section: 'garden', index: 0 }).selection, {
    kind: 'card',
    section: 'kitchen',
    index: 1,
  });
  // The selected card itself is followed to its new list.
  assert.deepEqual(
    move({ section: 'kitchen', index: 1 }, { section: 'garden', index: 0 }).selection,
    {
      kind: 'card',
      section: 'garden',
      index: 0,
    },
  );
});

test('duplicate-card inserts a copy right after the card and selects the copy', () => {
  const state = startSections();
  const copied = draftReducer(state, { type: 'duplicate-card', section: 'kitchen', index: 0 });

  assert.deepEqual(sectionCards(copied, 'kitchen'), ['light.island', 'light.island', 'light.sink']);
  assert.deepEqual(copied.selection, { kind: 'card', section: 'kitchen', index: 1 });
  assert.notEqual(view(copied).sections![0]!.cards![1], view(copied).sections![0]!.cards![0]);
  assert.deepEqual(homeCards(copied), ['light.hall', 'switch.lamp']);
  assert.ok(copied.generation > state.generation);
  assert.deepEqual(draftIssues(copied), []);

  // The copy is selected even when another card was; the original stays where it was.
  const shifted = draftReducer(selectCard(state, null, 1), {
    type: 'duplicate-card',
    index: 0,
  });

  assert.deepEqual(homeCards(shifted), ['light.hall', 'light.hall', 'switch.lamp']);
  assert.deepEqual(shifted.selection, { kind: 'card', index: 1 });

  // Through the canvas, and with a bad address it changes nothing.
  const fromCanvas = draftReducer(
    state,
    canvas(state, { type: 'everdash.editor.card.duplicate', section: null, index: 1 }),
  );

  assert.deepEqual(homeCards(fromCanvas), ['light.hall', 'switch.lamp', 'switch.lamp']);
  assert.equal(draftReducer(state, { type: 'duplicate-card', index: 5 }), state);
  assert.equal(
    draftReducer(
      state,
      canvas(state, { type: 'everdash.editor.card.duplicate', section: 'nope', index: 0 }),
    ),
    state,
  );
});

test('a card can be moved to the end of a section from the canvas menu', () => {
  const state = startSections();
  const send = (message: Record<string, unknown>) => draftReducer(state, canvas(state, message));

  const into = send({
    type: 'everdash.editor.card.move',
    section: null,
    index: 0,
    toSection: 'kitchen',
    toEnd: true,
  });

  assert.deepEqual(sectionCards(into, 'kitchen'), ['light.island', 'light.sink', 'light.hall']);

  const out = send({
    type: 'everdash.editor.card.move',
    section: 'kitchen',
    index: 0,
    toSection: null,
    toEnd: true,
  });

  assert.deepEqual(homeCards(out), ['light.hall', 'switch.lamp', 'light.island']);

  // Within its own list, "the end" is the last position.
  const last = send({ type: 'everdash.editor.card.move', section: null, index: 0, toEnd: true });

  assert.deepEqual(homeCards(last), ['switch.lamp', 'light.hall']);
  assert.equal(
    send({
      type: 'everdash.editor.card.move',
      section: null,
      index: 0,
      toSection: 'nope',
      toEnd: true,
    }),
    state,
  );
});

test('moves to a bad section or index change nothing', () => {
  const state = startSections();
  const relocate = (from: CardLocation, to: CardLocation) =>
    draftReducer(state, { type: 'relocate-card', from, to });

  assert.equal(relocate({ section: null, index: 0 }, { section: 'nope', index: 0 }), state);
  assert.equal(relocate({ section: null, index: 5 }, { section: 'kitchen', index: 0 }), state);
  assert.equal(relocate({ section: null, index: 0 }, { section: 'kitchen', index: 3 }), state);
  assert.equal(relocate({ section: 'kitchen', index: 1 }, { section: 'kitchen', index: 1 }), state);
  assert.equal(relocate({ section: 'kitchen', index: 0 }, { section: 'kitchen', index: 2 }), state);
});

test('send-card puts a card at the end of another section from the inspector', () => {
  const state = startSections();
  const sent = draftReducer(selectCard(state, null, 0), {
    type: 'send-card',
    section: null,
    index: 0,
    toSection: 'kitchen',
  });

  assert.deepEqual(sectionCards(sent, 'kitchen'), ['light.island', 'light.sink', 'light.hall']);
  assert.deepEqual(sent.selection, { kind: 'card', section: 'kitchen', index: 2 });

  const back = draftReducer(sent, {
    type: 'send-card',
    section: 'kitchen',
    index: 2,
    toSection: null,
  });

  assert.deepEqual(homeCards(back), ['switch.lamp', 'light.hall']);
  assert.equal(draftReducer(state, { type: 'send-card', index: 0, toSection: null }), state);
  assert.equal(draftReducer(state, { type: 'send-card', index: 0, toSection: 'nope' }), state);
});

test('canvas messages address cards by section and index', () => {
  const state = startSections();
  const send = (message: Record<string, unknown>) =>
    draftReducer(state, {
      type: 'canvas-message',
      message: { generation: state.generation, viewId: 'home', ...message },
    });

  assert.deepEqual(
    send({ type: 'everdash.editor.card.edit', section: 'kitchen', index: 1 }).selection,
    {
      kind: 'card',
      section: 'kitchen',
      index: 1,
    },
  );
  // Null and a missing section both mean the unsectioned cards.
  assert.deepEqual(send({ type: 'everdash.editor.card.edit', section: null, index: 1 }).selection, {
    kind: 'card',
    index: 1,
  });
  assert.equal(send({ type: 'everdash.editor.card.edit', section: 'garden', index: 0 }), state);
  assert.equal(send({ type: 'everdash.editor.card.edit', section: 'nope', index: 0 }), state);
  assert.equal(send({ type: 'everdash.editor.card.edit', section: 4, index: 0 }), state);

  const dragged = send({
    type: 'everdash.editor.card.move',
    section: null,
    index: 0,
    toSection: 'garden',
    to: 0,
  });

  assert.deepEqual(sectionCards(dragged, 'garden'), ['light.hall']);
  assert.deepEqual(homeCards(dragged), ['switch.lamp']);
  // A drag moves the card without selecting it.
  assert.deepEqual(dragged.selection, { kind: 'view' });

  // Moving inside a section by offset, or to an index of the card's own section.
  const within = send({
    type: 'everdash.editor.card.move',
    section: 'kitchen',
    index: 0,
    offset: 1,
  });

  assert.deepEqual(sectionCards(within, 'kitchen'), ['light.sink', 'light.island']);
  assert.equal(
    send({ type: 'everdash.editor.card.move', section: 'kitchen', index: 0, offset: 2 }),
    state,
  );
  assert.deepEqual(
    sectionCards(
      send({ type: 'everdash.editor.card.move', section: 'kitchen', index: 0, to: 1 }),
      'kitchen',
    ),
    ['light.sink', 'light.island'],
  );
  assert.equal(
    send({ type: 'everdash.editor.card.move', section: null, index: 0, toSection: 7, to: 0 }),
    state,
  );
});

test('canvas messages select, reorder and delete-request sections', () => {
  const state = startSections();
  const send = (message: Record<string, unknown>) =>
    draftReducer(state, {
      type: 'canvas-message',
      message: { generation: state.generation, viewId: 'home', ...message },
    });

  assert.deepEqual(send({ type: 'everdash.editor.section.edit', section: 'garden' }).selection, {
    kind: 'section',
    id: 'garden',
  });

  const deleting = send({ type: 'everdash.editor.section.delete', section: 'garden' });

  assert.deepEqual(deleting.selection, { kind: 'section', id: 'garden' });
  assert.equal(deleting.document, state.document);
  assert.deepEqual(
    sectionIds(send({ type: 'everdash.editor.section.move', section: 'garden', offset: -1 })),
    ['garden', 'kitchen'],
  );
  assert.deepEqual(send({ type: 'everdash.editor.section.rename', section: 'garden' }).selection, {
    kind: 'section',
    id: 'garden',
  });
  // Dragging a section reports its final position among the sections.
  assert.deepEqual(
    sectionIds(send({ type: 'everdash.editor.section.move', section: 'kitchen', to: 1 })),
    ['garden', 'kitchen'],
  );
  assert.equal(send({ type: 'everdash.editor.section.move', section: 'kitchen', to: 2 }), state);
  assert.equal(send({ type: 'everdash.editor.section.move', section: 'kitchen', to: 0 }), state);
  assert.equal(send({ type: 'everdash.editor.section.edit', section: 'nope' }), state);
  assert.equal(send({ type: 'everdash.editor.section.move', section: 'garden', offset: 2 }), state);
  assert.equal(send({ type: 'everdash.editor.section.move', section: 'garden', offset: 1 }), state);
});

test('a card is added to the section it was started in', () => {
  const state = draftReducer(startSections(), {
    type: 'start-card',
    kind: 'light',
    section: 'garden',
  });

  assert.deepEqual(state.selection, { kind: 'card', section: 'garden', index: 0 });
  assert.equal(isIncomplete(view(state).sections![1]!.cards![0]!), true);

  const finished = run(
    state,
    {
      type: 'update-card',
      section: 'garden',
      index: 0,
      card: { type: 'light', entity: 'light.shed' },
    },
    { type: 'finish-card', section: 'garden', index: 0 },
  );

  assert.deepEqual(sectionCards(finished, 'garden'), ['light.shed']);
  assert.deepEqual(finished.selection, { kind: 'card', section: 'garden', index: 0 });
  assert.equal(
    draftReducer(startSections(), { type: 'start-card', kind: 'light', section: 'nope' }).selection
      .kind,
    'view',
  );

  // The canvas can start a card in a section too.
  const fromCanvas = draftReducer(startSections(), {
    type: 'canvas-message',
    message: {
      type: 'everdash.editor.card.add',
      generation: startSections().generation,
      viewId: 'home',
      section: 'kitchen',
    },
  });

  assert.deepEqual(fromCanvas.selection, { kind: 'card', section: 'kitchen', index: 2 });
});

test('a new card can be sent to another section like any card', () => {
  const state = run(
    startSections(),
    { type: 'start-card', kind: 'light' },
    { type: 'send-card', section: null, index: 2, toSection: 'kitchen' },
  );

  assert.equal(isIncomplete(view(state).sections![0]!.cards![2]!), true);
  assert.deepEqual(state.selection, { kind: 'card', section: 'kitchen', index: 2 });
  assert.deepEqual(homeCards(state), ['light.hall', 'switch.lamp']);

  const back = draftReducer(state, {
    type: 'send-card',
    section: 'kitchen',
    index: 2,
    toSection: null,
  });

  assert.equal(isIncomplete(view(back).cards![2]!), true);
});

test('a new card survives section actions and is carried with a section that is kept', () => {
  const pending = draftReducer(startSections(), {
    type: 'start-card',
    kind: 'light',
    section: 'kitchen',
  });
  const added = draftReducer(pending, { type: 'add-section' });

  assert.equal(sectionIds(added).length, 3);
  assert.equal(isIncomplete(view(added).sections![0]!.cards![2]!), true);

  const moved = draftReducer(added, { type: 'move-section', id: 'garden', offset: -1 });

  assert.equal(isIncomplete(view(moved).sections![1]!.cards![2]!), true);

  // Keeping the cards of a deleted section keeps the new card, outside any section.
  const kept = draftReducer(pending, { type: 'delete-section', id: 'kitchen', cards: 'keep' });

  assert.equal(sectionIds(kept).includes('kitchen'), false);
  assert.equal(isIncomplete(view(kept).cards!.at(-1)!), true);
  assert.equal(unfinishedCardIssue(kept) !== null, true);

  // Deleting the cards takes the new card with them, and with it the save gate.
  const deleted = draftReducer(pending, { type: 'delete-section', id: 'kitchen', cards: 'delete' });

  assert.equal(hasIncomplete(deleted.document), false);
  assert.deepEqual(draftIssues(deleted), []);

  // A canvas move across sections and a delete of another card leave it in place.
  const crossed = draftReducer(
    pending,
    canvas(pending, {
      type: 'everdash.editor.card.move',
      section: null,
      index: 0,
      toSection: 'garden',
      to: 0,
    }),
  );

  assert.deepEqual(sectionCards(crossed, 'garden'), ['light.hall']);
  assert.deepEqual(crossed.selection, { kind: 'card', section: 'kitchen', index: 2 });

  const removed = draftReducer(crossed, { type: 'delete-card', section: 'kitchen', index: 0 });

  assert.deepEqual(sectionCards(removed, 'kitchen'), ['light.sink', '']);
  assert.deepEqual(removed.selection, { kind: 'card', section: 'kitchen', index: 1 });
});

test('card edits and deletes inside a section leave the other lists alone', () => {
  const state = startSections();
  const edited = draftReducer(state, {
    type: 'update-card',
    section: 'kitchen',
    index: 1,
    card: { type: 'light', entity: 'light.counter' },
  });

  assert.deepEqual(sectionCards(edited, 'kitchen'), ['light.island', 'light.counter']);
  assert.deepEqual(homeCards(edited), ['light.hall', 'switch.lamp']);

  const deleted = draftReducer(state, { type: 'delete-card', section: 'kitchen', index: 0 });

  assert.deepEqual(sectionCards(deleted, 'kitchen'), ['light.sink']);
  assert.deepEqual(deleted.selection, { kind: 'view' });
  assert.equal(draftReducer(state, { type: 'delete-card', section: 'garden', index: 0 }), state);

  const selected = draftReducer(state, {
    type: 'select',
    selection: { kind: 'card', section: 'garden', index: 0 },
  });

  assert.equal(selected, state);
});

test('sections survive the save and discard round trip as plain JSON', () => {
  const edited = run(startSections(), { type: 'rename-section', id: 'garden', title: 'Yard' });
  const json = serializeDocument(edited.document);

  assert.deepEqual(
    JSON.parse(json).views[0].sections.map((item: { title: string }) => item.title),
    ['Kitchen', 'Yard'],
  );

  const discarded = draftReducer(edited, { type: 'discard' });

  assert.deepEqual(sectionIds(discarded), ['kitchen', 'garden']);
  assert.equal(view(discarded).sections![1]!.title, 'Garden');
});
