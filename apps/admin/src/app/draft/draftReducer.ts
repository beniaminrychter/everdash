import type {
  BadgeConfig,
  CardConfig,
  DashboardDocument,
  HomeConfig,
  SectionConfig,
  ViewConfig,
} from '@everdash/contracts/config/types';
import { validateDashboard } from '@everdash/contracts/config/validate';
import { createPendingCard, createSection, createView, moveItem, toDocument } from './builder';
import type { CardKind } from './builder';
import {
  finishCard,
  hasIncomplete,
  isIncomplete,
  keepMarker,
  markIncomplete,
  viewsWithIncomplete,
  withoutIncomplete,
} from './incomplete';

/**
 * Where a card is: the id of its section, or null (or omitted) for the cards outside any section.
 * Selections leave `section` out for the unsectioned cards.
 */
export interface CardLocation {
  section?: string | null;
  index: number;
}

export type Selection =
  | { kind: 'view' }
  | { kind: 'card'; section?: string; index: number }
  | { kind: 'section'; id: string }
  | { kind: 'badge'; index: number }
  | { kind: 'pending-badge'; badge: BadgeConfig };

/** What happens to a deleted section's cards. */
export type SectionCards = 'delete' | 'keep';

export interface DraftState {
  document: DashboardDocument;
  baseline: string;
  revision: string | null;
  viewId: string;
  selection: Selection;
  generation: number;
  changes: number;
}

export type DraftAction =
  | { type: 'loaded'; document: DashboardDocument; revision: string | null }
  | {
      type: 'saved';
      document: DashboardDocument;
      /** The document the save request carried; edits made while it was pending differ from it. */
      sent: DashboardDocument;
      revision: string | null;
    }
  | { type: 'discard' }
  | { type: 'replace'; document: DashboardDocument }
  | { type: 'select-view'; viewId: string }
  | { type: 'add-view' }
  | { type: 'rename-view'; title: string }
  | { type: 'move-view'; offset: -1 | 1 }
  | { type: 'delete-view' }
  | { type: 'select'; selection: Selection }
  | { type: 'canvas-message'; message: unknown }
  /** Adds a card that still needs an entity at the end of a section (or of the unsectioned cards). */
  | { type: 'start-card'; kind: CardKind; section?: string | null }
  | { type: 'start-badge' }
  | { type: 'update-pending'; value: BadgeConfig }
  | { type: 'commit-pending' }
  /** Finishes a card that was being added, once it is valid. */
  | { type: 'finish-card'; section?: string | null; index: number }
  | { type: 'update-card'; section?: string | null; index: number; card: CardConfig }
  /** Inserts a copy of a card right after it and selects the copy. */
  | { type: 'duplicate-card'; section?: string | null; index: number }
  | { type: 'move-card'; section?: string | null; index: number; offset: number }
  /** Moves a card to a final position, which may be in another section. */
  | { type: 'relocate-card'; from: CardLocation; to: CardLocation }
  /** Moves a card to the end of another section (or of the unsectioned cards). */
  | { type: 'send-card'; section?: string | null; index: number; toSection: string | null }
  | { type: 'delete-card'; section?: string | null; index: number }
  | { type: 'add-section' }
  | { type: 'rename-section'; id: string; title: string }
  | { type: 'move-section'; id: string; offset: -1 | 1 }
  /** Moves a section to a final position among the sections. */
  | { type: 'relocate-section'; id: string; to: number }
  | { type: 'delete-section'; id: string; cards: SectionCards }
  | { type: 'update-badge'; index: number; badge: BadgeConfig }
  | { type: 'delete-badge'; index: number }
  /** Inserts a copy of a badge right after it and selects the copy. */
  | { type: 'duplicate-badge'; index: number }
  /** Moves a badge to a final position among the badges and selects it there. */
  | { type: 'move-badge'; index: number; to: number }
  | { type: 'update-home'; home: Partial<HomeConfig> };

const viewSelection: Selection = { kind: 'view' };

export function serializeDocument(document: DashboardDocument): string {
  return JSON.stringify(toDocument(document), null, 2);
}

export function initialDraft(document: DashboardDocument): DraftState {
  return {
    document,
    baseline: serializeDocument(document),
    revision: null,
    viewId: document.views[0]?.id ?? '',
    selection: viewSelection,
    generation: 0,
    changes: 0,
  };
}

export function isDirty(state: DraftState): boolean {
  return serializeDocument(state.document) !== state.baseline;
}

/**
 * Saving is blocked while a new card is unfinished, rather than saving without it: leaving it out
 * would silently drop what the user just added. Null when no card is unfinished.
 */
export function unfinishedCardIssue(state: DraftState): string | null {
  const unfinished = viewsWithIncomplete(state.document);

  if (unfinished.length === 0) {
    return null;
  }

  // The card may be in a view that is not shown, so say where to look.
  const elsewhere = unfinished.find((view) => view.id !== state.viewId);

  return elsewhere
    ? `Finish or remove the new card in “${elsewhere.title}” before saving.`
    : 'Finish or remove the new card before saving.';
}

/** Why the dashboard cannot be saved yet; empty when it can. */
export function draftIssues(state: DraftState): string[] {
  const unfinished = unfinishedCardIssue(state);
  const issues: string[] = unfinished ? [unfinished] : [];

  // The cards still being added are left out, so everything else is checked as it will be saved.
  const result = validateDashboard(withoutIncomplete(state.document));

  if (result.ok) {
    return issues;
  }

  return [
    ...issues,
    ...result.issues.map((issue) =>
      issue.path ? `${issue.path}: ${issue.message}` : issue.message,
    ),
  ];
}

function resolveViewId(document: DashboardDocument, viewId: string): string {
  if (document.views.some((view) => view.id === viewId)) {
    return viewId;
  }

  return document.views[0]?.id ?? '';
}

function currentView(state: DraftState): ViewConfig | undefined {
  return state.document.views.find((view) => view.id === state.viewId);
}

function inRange(index: unknown, count: number): index is number {
  return typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < count;
}

function sectionOf(location: { section?: string | null }): string | null {
  return location.section ?? null;
}

/** A card selection, which leaves `section` out for the unsectioned cards. */
function cardSelection(section: string | null, index: number): Selection {
  return section === null ? { kind: 'card', index } : { kind: 'card', section, index };
}

/** The cards of a section, or of the unsectioned area for null. Undefined when the section is gone. */
function listOf(
  view: ViewConfig | undefined,
  section: string | null,
): readonly CardConfig[] | undefined {
  if (!view) {
    return undefined;
  }

  if (section === null) {
    return view.cards ?? [];
  }

  return view.sections?.find((item) => item.id === section)?.cards ?? undefined;
}

/** The view with one card list replaced. A section that does not exist leaves the view as it is. */
function withList(
  view: ViewConfig,
  section: string | null,
  cards: readonly CardConfig[],
): ViewConfig {
  if (section === null) {
    return { ...view, cards };
  }

  return {
    ...view,
    sections: (view.sections ?? []).map((item) =>
      item.id === section ? { ...item, cards } : item,
    ),
  };
}

/** Drops the sections key when none are left, so a view without sections stays as it was. */
function withSections(view: ViewConfig, sections: readonly SectionConfig[]): ViewConfig {
  if (sections.length > 0) {
    return { ...view, sections };
  }

  const { sections: _removed, ...rest } = view;

  return rest;
}

function hasSection(view: ViewConfig | undefined, section: string | null): boolean {
  return listOf(view, section) !== undefined;
}

function changeDocument(
  state: DraftState,
  document: DashboardDocument,
  patch: Partial<DraftState> = {},
): DraftState {
  return {
    ...state,
    ...patch,
    document,
    generation: state.generation + 1,
    changes: state.changes + 1,
  };
}

function changeCurrentView(
  state: DraftState,
  update: (view: ViewConfig) => ViewConfig,
  patch: Partial<DraftState> = {},
): DraftState {
  const views = state.document.views.map((view) =>
    view.id === state.viewId ? update(view) : view,
  );

  return changeDocument(state, { ...state.document, views }, patch);
}

function commitIfValid(
  state: DraftState,
  view: ViewConfig,
  selection: Selection,
): DraftState | null {
  const document = {
    ...state.document,
    views: state.document.views.map((item) => (item.id === view.id ? view : item)),
  };

  // Cards still being added are not part of what is saved, so they do not take part in the check.
  if (!validateDashboard(withoutIncomplete(document)).ok) {
    return null;
  }

  return changeDocument(state, document, { selection });
}

/** Adds the badge being added to the view, once it is valid. */
function withPending(state: DraftState): DraftState | null {
  const view = currentView(state);
  const { selection } = state;

  if (!view || selection.kind !== 'pending-badge') {
    return null;
  }

  return commitIfValid(
    state,
    { ...view, badges: [...(view.badges ?? []), selection.badge] },
    { kind: 'badge', index: (view.badges ?? []).length },
  );
}

/**
 * Applies an action to an existing card or badge without losing a badge that is still being
 * added. A pending badge that is valid is committed first, at the end of its list, so the
 * indexes the canvas sent stay correct. An incomplete one stays pending: the action still
 * changes the document, but the inspector stays on the pending badge until it is added or
 * cancelled. (Cards being added are ordinary cards in the draft and need none of this.)
 */
function keepingPending(state: DraftState, apply: (state: DraftState) => DraftState): DraftState {
  if (state.selection.kind !== 'pending-badge') {
    return apply(state);
  }

  const committed = withPending(state);

  if (committed) {
    return apply(committed);
  }

  const result = apply(state);

  if (result.document === state.document) {
    return state;
  }

  return { ...result, selection: state.selection };
}

/** The selected card's place, or null when something else is selected. */
function selectedCard(selection: Selection): { section: string | null; index: number } | null {
  if (selection.kind !== 'card') {
    return null;
  }

  return { section: selection.section ?? null, index: selection.index };
}

/** The selection once the card at `at` is taken out of its list; deselected if it was that card. */
function afterRemoval(
  selection: Selection,
  at: { section: string | null; index: number },
): Selection {
  const card = selectedCard(selection);

  if (!card || card.section !== at.section) {
    return selection;
  }

  if (card.index === at.index) {
    return viewSelection;
  }

  return card.index > at.index ? cardSelection(card.section, card.index - 1) : selection;
}

/** The selection once a card is put in at `at`, which pushes the cards from there on one later. */
function afterInsertion(
  selection: Selection,
  at: { section: string | null; index: number },
): Selection {
  const card = selectedCard(selection);

  if (!card || card.section !== at.section || card.index < at.index) {
    return selection;
  }

  return cardSelection(card.section, card.index + 1);
}

/**
 * The selection after a card moves. The selected card is followed to its new place; moving any
 * other card only shifts the selected card's index where it has to, and never selects the moved one.
 */
function afterMove(
  selection: Selection,
  from: { section: string | null; index: number },
  to: { section: string | null; index: number },
): Selection {
  const card = selectedCard(selection);

  if (card && card.section === from.section && card.index === from.index) {
    return cardSelection(to.section, to.index);
  }

  return afterInsertion(afterRemoval(selection, from), to);
}

/**
 * Moves a card to its final position `to`, in the same list or in another. Within a list the final
 * index is one of its positions; into another list it may also be the end. Anything else changes
 * nothing, as does a move to the card's own position.
 */
function moveCard(state: DraftState, from: CardLocation, to: CardLocation): DraftState {
  const view = currentView(state);
  const fromSection = sectionOf(from);
  const toSection = sectionOf(to);
  const source = listOf(view, fromSection);
  const destination = listOf(view, toSection);

  if (!view || !source || !destination || !inRange(from.index, source.length)) {
    return state;
  }

  const selection = afterMove(
    state.selection,
    { section: fromSection, index: from.index },
    { section: toSection, index: to.index },
  );

  if (fromSection === toSection) {
    if (!inRange(to.index, source.length) || from.index === to.index) {
      return state;
    }

    const moved = [...source];
    const [card] = moved.splice(from.index, 1);

    moved.splice(to.index, 0, card!);

    return changeCurrentView(state, (current) => withList(current, fromSection, moved), {
      selection,
    });
  }

  if (!inRange(to.index, destination.length + 1)) {
    return state;
  }

  const remaining = source.filter((_card, index) => index !== from.index);
  const inserted = [...destination];

  inserted.splice(to.index, 0, source[from.index]!);

  return changeCurrentView(
    state,
    (current) => withList(withList(current, fromSection, remaining), toSection, inserted),
    { selection },
  );
}

/**
 * Reads the destination of a canvas move: an offset within the list, the end of a list, or a
 * final index in a list.
 */
function moveTarget(
  message: Record<string, unknown>,
  from: CardLocation,
  view: ViewConfig,
): CardLocation | null {
  if (typeof message.offset === 'number') {
    return { section: sectionOf(from), index: from.index + message.offset };
  }

  const toSection = 'toSection' in message ? message.toSection : sectionOf(from);

  if (toSection !== null && typeof toSection !== 'string') {
    return null;
  }

  if (message.toEnd === true) {
    const length = listOf(view, toSection)?.length;

    if (length === undefined) {
      return null;
    }

    // Within its own list the last position is one before the length; elsewhere it is the length.
    return { section: toSection, index: toSection === sectionOf(from) ? length - 1 : length };
  }

  if (typeof message.to !== 'number') {
    return null;
  }

  return { section: toSection, index: message.to };
}

/** Reads a section reference from a message: an id, or null (or nothing) for the unsectioned cards. */
function readSection(message: Record<string, unknown>): string | null | undefined {
  const { section } = message;

  if (section === undefined || section === null) {
    return null;
  }

  return typeof section === 'string' ? section : undefined;
}

/** Adds a card that still needs an entity at the end of a list and selects it. */
function startCard(state: DraftState, kind: CardKind, section: string | null): DraftState {
  const cards = listOf(currentView(state), section);

  // One new card at a time: the user is still filling it in.
  if (!cards || hasIncomplete(state.document)) {
    return state;
  }

  const card = markIncomplete(createPendingCard(kind));

  return changeCurrentView(state, (view) => withList(view, section, [...cards, card]), {
    selection: cardSelection(section, cards.length),
  });
}

/** Removes a card from its list. */
function removeCard(state: DraftState, location: CardLocation): DraftState {
  const section = sectionOf(location);
  const cards = listOf(currentView(state), section) ?? [];

  if (!inRange(location.index, cards.length)) {
    return state;
  }

  return changeCurrentView(
    state,
    (view) =>
      withList(
        view,
        section,
        cards.filter((_card, index) => index !== location.index),
      ),
    { selection: afterRemoval(state.selection, { section, index: location.index }) },
  );
}

/** Inserts a copy of a card right after it and selects the copy. A new card cannot be copied. */
function duplicateCard(state: DraftState, location: CardLocation): DraftState {
  const section = sectionOf(location);
  const cards = listOf(currentView(state), section) ?? [];
  const original = cards[location.index];

  if (!inRange(location.index, cards.length) || !original || isIncomplete(original)) {
    return state;
  }

  const copies = [...cards];

  copies.splice(location.index + 1, 0, structuredClone(original));

  return changeCurrentView(state, (view) => withList(view, section, copies), {
    selection: cardSelection(section, location.index + 1),
  });
}

/** Inserts a copy of a badge right after it and selects the copy. */
function duplicateBadge(state: DraftState, index: number): DraftState {
  const badges = currentView(state)?.badges ?? [];

  if (!inRange(index, badges.length)) {
    return state;
  }

  const copies = [...badges];

  copies.splice(index + 1, 0, structuredClone(badges[index]!));

  return changeCurrentView(state, (view) => ({ ...view, badges: copies }), {
    selection: { kind: 'badge', index: index + 1 },
  });
}

/** Moves a badge to a final index of the badge list and selects it there. */
function moveBadge(state: DraftState, index: number, to: number): DraftState {
  const badges = currentView(state)?.badges ?? [];

  if (!inRange(index, badges.length) || !inRange(to, badges.length) || index === to) {
    return state;
  }

  const moved = [...badges];
  const [badge] = moved.splice(index, 1);

  moved.splice(to, 0, badge!);

  return changeCurrentView(state, (view) => ({ ...view, badges: moved }), {
    selection: { kind: 'badge', index: to },
  });
}

/** Finishes a card that was being added, if the dashboard is valid with it in. */
function finishNewCard(state: DraftState, location: CardLocation): DraftState {
  const view = currentView(state);
  const section = sectionOf(location);
  const cards = listOf(view, section) ?? [];
  const card = cards[location.index];

  if (!view || !card || !isIncomplete(card)) {
    return state;
  }

  const finished = cards.map((item, index) => (index === location.index ? finishCard(item) : item));
  const committed = commitIfValid(
    state,
    withList(view, section, finished),
    cardSelection(section, location.index),
  );

  return committed ?? state;
}

function moveSection(state: DraftState, id: string, offset: -1 | 1): DraftState {
  const sections = currentView(state)?.sections ?? [];
  const index = sections.findIndex((section) => section.id === id);
  const moved = moveItem(sections, index, offset);

  if (index === -1 || moved.every((section, position) => section === sections[position])) {
    return state;
  }

  return changeCurrentView(state, (view) => withSections(view, moved));
}

/** Moves a section to a final position among the sections. */
function relocateSection(state: DraftState, id: string, to: number): DraftState {
  const sections = currentView(state)?.sections ?? [];
  const index = sections.findIndex((section) => section.id === id);

  if (index === -1 || !inRange(to, sections.length) || to === index) {
    return state;
  }

  const moved = [...sections];
  const [section] = moved.splice(index, 1);

  moved.splice(to, 0, section!);

  return changeCurrentView(state, (view) => withSections(view, moved));
}

/** Deletes a section along with its cards, or hands its cards to the end of the unsectioned ones. */
function deleteSection(state: DraftState, id: string, cards: SectionCards): DraftState {
  const view = currentView(state);
  const section = view?.sections?.find((item) => item.id === id);

  if (!view || !section) {
    return state;
  }

  return changeCurrentView(
    state,
    (current) => {
      const next = withSections(
        current,
        (current.sections ?? []).filter((item) => item.id !== id),
      );

      return cards === 'keep'
        ? { ...next, cards: [...(next.cards ?? []), ...(section.cards ?? [])] }
        : next;
    },
    { selection: viewSelection },
  );
}

function reduceCanvasMessage(state: DraftState, value: unknown): DraftState {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return state;
  }

  const message = value as Record<string, unknown>;

  if (message.generation !== state.generation) {
    return state;
  }

  if (message.type === 'everdash.editor.view.select') {
    if (typeof message.viewId !== 'string') {
      return state;
    }

    if (!state.document.views.some((view) => view.id === message.viewId)) {
      return state;
    }

    return { ...state, viewId: message.viewId, selection: viewSelection };
  }

  if (message.viewId !== state.viewId) {
    return state;
  }

  const view = currentView(state);

  if (!view) {
    return state;
  }

  const { index } = message;
  const section = readSection(message);

  if (message.type === 'everdash.editor.card.add') {
    if (section === undefined || !hasSection(view, section)) {
      return state;
    }

    return startCard(state, 'light', section);
  }

  if (
    message.type === 'everdash.editor.card.edit' ||
    message.type === 'everdash.editor.card.delete' ||
    message.type === 'everdash.editor.card.duplicate'
  ) {
    const cards = section === undefined ? [] : (listOf(view, section) ?? []);

    if (section === undefined || !inRange(index, cards.length)) {
      return state;
    }

    const location = { section, index };

    if (message.type === 'everdash.editor.card.duplicate') {
      return keepingPending(state, (current) => duplicateCard(current, location));
    }

    // A card that was only just added has nothing to lose, so deleting it needs no confirmation.
    if (message.type === 'everdash.editor.card.delete' && isIncomplete(cards[index]!)) {
      return keepingPending(state, (current) => removeCard(current, location));
    }

    // Deleting a finished card needs a confirmation step owned by the UI, so the canvas only selects it.
    return keepingPending(state, (current) => ({
      ...current,
      selection: cardSelection(section, index),
    }));
  }

  if (message.type === 'everdash.editor.card.move') {
    if (section === undefined || !inRange(index, (listOf(view, section) ?? []).length)) {
      return state;
    }

    // A move names its destination as an offset from the card, the end of a list or a final index.
    const target = moveTarget(message, { section, index }, view);

    if (!target) {
      return state;
    }

    return keepingPending(state, (current) => moveCard(current, { section, index }, target));
  }

  if (
    message.type === 'everdash.editor.section.edit' ||
    message.type === 'everdash.editor.section.rename' ||
    message.type === 'everdash.editor.section.delete'
  ) {
    const id = message.section;

    if (typeof id !== 'string' || !hasSection(view, id)) {
      return state;
    }

    // As with cards, deleting a section is confirmed by the UI; the canvas only selects it.
    return keepingPending(state, (current) => ({ ...current, selection: { kind: 'section', id } }));
  }

  if (message.type === 'everdash.editor.section.move') {
    const id = message.section;

    if (typeof id !== 'string') {
      return state;
    }

    if (typeof message.to === 'number') {
      const to = message.to;

      return keepingPending(state, (current) => relocateSection(current, id, to));
    }

    if (message.offset !== -1 && message.offset !== 1) {
      return state;
    }

    return keepingPending(state, (current) => moveSection(current, id, message.offset as -1 | 1));
  }

  if (message.type === 'everdash.editor.badge.duplicate') {
    if (!inRange(index, (view.badges ?? []).length)) {
      return state;
    }

    return keepingPending(state, (current) => duplicateBadge(current, index));
  }

  if (message.type === 'everdash.editor.badge.move') {
    if (!inRange(index, (view.badges ?? []).length)) {
      return state;
    }

    // A move names its destination as an offset from the badge or as a final index.
    const to =
      typeof message.to === 'number'
        ? message.to
        : message.offset === -1 || message.offset === 1
          ? index + message.offset
          : undefined;

    if (to === undefined) {
      return state;
    }

    return keepingPending(state, (current) => moveBadge(current, index, to));
  }

  if (
    message.type === 'everdash.editor.badge.edit' ||
    message.type === 'everdash.editor.badge.delete'
  ) {
    if (!inRange(index, (view.badges ?? []).length)) {
      return state;
    }

    return keepingPending(state, (current) => ({
      ...current,
      selection: { kind: 'badge', index },
    }));
  }

  return state;
}

function createViewId(document: DashboardDocument): string {
  let id = `view-${Date.now().toString(36)}`;

  while (document.views.some((view) => view.id === id)) {
    id = `${id}-1`;
  }

  return id;
}

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'loaded': {
      return {
        ...state,
        document: action.document,
        baseline: serializeDocument(action.document),
        revision: action.revision,
        viewId: resolveViewId(action.document, state.viewId),
        selection: viewSelection,
        generation: state.generation + 1,
        changes: 0,
      };
    }

    case 'saved': {
      if (serializeDocument(state.document) !== serializeDocument(action.sent)) {
        // The user kept editing while the request was pending: keep those edits and
        // treat the server copy as the new baseline, so they still count as unsaved.
        return {
          ...state,
          baseline: serializeDocument(action.document),
          revision: action.revision,
        };
      }

      // The saved document equals the draft, so the editing context stays put.
      return {
        ...state,
        document: action.document,
        baseline: serializeDocument(action.document),
        revision: action.revision,
        viewId: resolveViewId(action.document, state.viewId),
        generation: state.generation + 1,
        changes: 0,
      };
    }

    case 'discard': {
      const document = JSON.parse(state.baseline) as DashboardDocument;

      return {
        ...state,
        document,
        viewId: resolveViewId(document, state.viewId),
        selection: viewSelection,
        generation: state.generation + 1,
        changes: 0,
      };
    }

    case 'replace': {
      return changeDocument(state, action.document, {
        viewId: resolveViewId(action.document, state.viewId),
        selection: viewSelection,
      });
    }

    case 'select-view': {
      return {
        ...state,
        viewId: resolveViewId(state.document, action.viewId),
        selection: viewSelection,
      };
    }

    case 'add-view': {
      const id = createViewId(state.document);
      const views = [...state.document.views, createView(id, 'New view')];

      return changeDocument(
        state,
        { ...state.document, views },
        { viewId: id, selection: viewSelection },
      );
    }

    case 'rename-view': {
      return changeCurrentView(state, (view) => ({ ...view, title: action.title }));
    }

    case 'move-view': {
      const index = state.document.views.findIndex((view) => view.id === state.viewId);
      const views = moveItem(state.document.views, index, action.offset);

      if (
        index === -1 ||
        views.every((view, position) => view === state.document.views[position])
      ) {
        return state;
      }

      return changeDocument(state, { ...state.document, views });
    }

    case 'delete-view': {
      const { views } = state.document;
      const index = views.findIndex((view) => view.id === state.viewId);

      if (views.length <= 1 || index === -1) {
        return state;
      }

      const remaining = views.filter((view) => view.id !== state.viewId);
      const next = remaining[Math.min(index, remaining.length - 1)]!;

      return changeDocument(
        state,
        { ...state.document, views: remaining },
        { viewId: next.id, selection: viewSelection },
      );
    }

    case 'select': {
      const view = currentView(state);
      const { selection } = action;

      if (
        selection.kind === 'card' &&
        !inRange(selection.index, (listOf(view, sectionOf(selection)) ?? []).length)
      ) {
        return state;
      }

      if (selection.kind === 'section' && !hasSection(view, selection.id)) {
        return state;
      }

      if (selection.kind === 'badge' && !inRange(selection.index, (view?.badges ?? []).length)) {
        return state;
      }

      return { ...state, selection };
    }

    case 'canvas-message': {
      return reduceCanvasMessage(state, action.message);
    }

    case 'start-card': {
      const section = action.section ?? null;

      if (!hasSection(currentView(state), section)) {
        return state;
      }

      return startCard(state, action.kind, section);
    }

    case 'start-badge': {
      const badge = { type: 'temperature', entity: '' } as unknown as BadgeConfig;

      return { ...state, selection: { kind: 'pending-badge', badge } };
    }

    case 'update-pending': {
      const { selection } = state;

      if (selection.kind === 'pending-badge') {
        return { ...state, selection: { kind: 'pending-badge', badge: action.value } };
      }

      return state;
    }

    case 'commit-pending': {
      return withPending(state) ?? state;
    }

    case 'finish-card': {
      return finishNewCard(state, action);
    }

    case 'update-card': {
      const section = sectionOf(action);
      const cards = listOf(currentView(state), section) ?? [];

      if (!inRange(action.index, cards.length)) {
        return state;
      }

      // A card that is still being added stays so until it is finished.
      return changeCurrentView(state, (view) =>
        withList(
          view,
          section,
          cards.map((card, index) =>
            index === action.index ? keepMarker(card, action.card) : card,
          ),
        ),
      );
    }

    case 'duplicate-card': {
      return keepingPending(state, (current) => duplicateCard(current, action));
    }

    case 'move-card': {
      const section = sectionOf(action);

      return keepingPending(state, (current) =>
        moveCard(
          current,
          { section, index: action.index },
          { section, index: action.index + action.offset },
        ),
      );
    }

    case 'relocate-card': {
      return keepingPending(state, (current) => moveCard(current, action.from, action.to));
    }

    case 'send-card': {
      const toSection = action.toSection;
      const target = listOf(currentView(state), toSection);

      if (!target || toSection === sectionOf(action)) {
        return state;
      }

      return keepingPending(state, (current) =>
        moveCard(
          current,
          { section: sectionOf(action), index: action.index },
          { section: toSection, index: (listOf(currentView(current), toSection) ?? []).length },
        ),
      );
    }

    case 'delete-card': {
      return keepingPending(state, (current) => removeCard(current, action));
    }

    case 'add-section': {
      return keepingPending(state, (current) => {
        const view = currentView(current);

        if (!view) {
          return current;
        }

        const section = createSection(view);

        return changeCurrentView(
          current,
          (item) => withSections(item, [...(item.sections ?? []), section]),
          { selection: { kind: 'section', id: section.id } },
        );
      });
    }

    case 'rename-section': {
      if (!hasSection(currentView(state), action.id)) {
        return state;
      }

      return changeCurrentView(state, (view) =>
        withSections(
          view,
          (view.sections ?? []).map((section) =>
            section.id === action.id ? { ...section, title: action.title } : section,
          ),
        ),
      );
    }

    case 'move-section': {
      return keepingPending(state, (current) => moveSection(current, action.id, action.offset));
    }

    case 'relocate-section': {
      return keepingPending(state, (current) => relocateSection(current, action.id, action.to));
    }

    case 'delete-section': {
      return keepingPending(state, (current) => deleteSection(current, action.id, action.cards));
    }

    case 'update-badge': {
      if (!inRange(action.index, (currentView(state)?.badges ?? []).length)) {
        return state;
      }

      return changeCurrentView(state, (view) => ({
        ...view,
        badges: (view.badges ?? []).map((badge, index) =>
          index === action.index ? action.badge : badge,
        ),
      }));
    }

    case 'delete-badge': {
      if (!inRange(action.index, (currentView(state)?.badges ?? []).length)) {
        return state;
      }

      return keepingPending(state, (current) =>
        changeCurrentView(
          current,
          (view) => ({
            ...view,
            badges: (view.badges ?? []).filter((_badge, index) => index !== action.index),
          }),
          { selection: viewSelection },
        ),
      );
    }

    case 'duplicate-badge': {
      return keepingPending(state, (current) => duplicateBadge(current, action.index));
    }

    case 'move-badge': {
      return keepingPending(state, (current) => moveBadge(current, action.index, action.to));
    }

    case 'update-home': {
      const document: DashboardDocument = {
        ...state.document,
        ...action.home,
        views: state.document.views,
      };

      if (action.home.polling) {
        document.polling = { ...state.document.polling, ...action.home.polling };
      }

      return changeDocument(state, document);
    }

    default: {
      return state;
    }
  }
}
