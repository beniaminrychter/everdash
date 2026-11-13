import type {
  BadgeConfig,
  CardConfig,
  DashboardDocument,
  HomeConfig,
  ViewConfig,
} from '@everdash/contracts/config/types';
import { validateDashboard } from '@everdash/contracts/config/validate';
import { createCard, createView, moveItem, toDocument } from './builder';
import type { CardKind } from './builder';

export type Selection =
  | { kind: 'view' }
  | { kind: 'card'; index: number }
  | { kind: 'badge'; index: number }
  | { kind: 'pending-card'; card: CardConfig }
  | { kind: 'pending-badge'; badge: BadgeConfig };

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
  | { type: 'loaded' | 'saved'; document: DashboardDocument; revision: string | null }
  | { type: 'discard' }
  | { type: 'replace'; document: DashboardDocument }
  | { type: 'select-view'; viewId: string }
  | { type: 'add-view' }
  | { type: 'rename-view'; title: string }
  | { type: 'move-view'; offset: -1 | 1 }
  | { type: 'delete-view' }
  | { type: 'select'; selection: Selection }
  | { type: 'canvas-message'; message: unknown }
  | { type: 'start-card'; kind: CardKind }
  | { type: 'start-badge' }
  | { type: 'update-pending'; value: CardConfig | BadgeConfig }
  | { type: 'commit-pending' }
  | { type: 'update-card'; index: number; card: CardConfig }
  | { type: 'move-card'; index: number; offset: -1 | 1 }
  | { type: 'delete-card'; index: number }
  | { type: 'update-badge'; index: number; badge: BadgeConfig }
  | { type: 'delete-badge'; index: number }
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

export function draftIssues(state: DraftState): string[] {
  const result = validateDashboard(state.document);

  if (result.ok) {
    return [];
  }

  return result.issues.map((issue) =>
    issue.path ? `${issue.path}: ${issue.message}` : issue.message,
  );
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

  if (!validateDashboard(document).ok) {
    return null;
  }

  return changeDocument(state, document, { selection });
}

function withPending(state: DraftState): DraftState | null {
  const view = currentView(state);
  const { selection } = state;

  if (!view) {
    return null;
  }

  if (selection.kind === 'pending-card') {
    return commitIfValid(
      state,
      { ...view, cards: [...(view.cards ?? []), selection.card] },
      { kind: 'card', index: (view.cards ?? []).length },
    );
  }

  if (selection.kind === 'pending-badge') {
    return commitIfValid(
      state,
      { ...view, badges: [...(view.badges ?? []), selection.badge] },
      { kind: 'badge', index: (view.badges ?? []).length },
    );
  }

  return null;
}

function moveCard(state: DraftState, index: number, offset: -1 | 1): DraftState {
  const cards = currentView(state)?.cards ?? [];
  const moved = moveItem(cards, index, offset);

  if (moved.every((card, position) => card === cards[position])) {
    return state;
  }

  return changeCurrentView(state, (view) => ({ ...view, cards: moved }), {
    selection: { kind: 'card', index: index + offset },
  });
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

  if (
    message.type === 'everdash.editor.card.edit' ||
    message.type === 'everdash.editor.card.delete'
  ) {
    if (!inRange(index, (view.cards ?? []).length)) {
      return state;
    }

    // Deleting needs a confirmation step owned by the UI, so the canvas only selects the card.
    return { ...state, selection: { kind: 'card', index } };
  }

  if (message.type === 'everdash.editor.card.move') {
    if (!inRange(index, (view.cards ?? []).length)) {
      return state;
    }

    if (message.offset !== -1 && message.offset !== 1) {
      return state;
    }

    return moveCard(state, index, message.offset);
  }

  if (
    message.type === 'everdash.editor.badge.edit' ||
    message.type === 'everdash.editor.badge.delete'
  ) {
    if (!inRange(index, (view.badges ?? []).length)) {
      return state;
    }

    return { ...state, selection: { kind: 'badge', index } };
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
    case 'loaded':
    case 'saved': {
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

      if (selection.kind === 'card' && !inRange(selection.index, (view?.cards ?? []).length)) {
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
      const card = { ...createCard(action.kind), entity: '' } as unknown as CardConfig;

      return { ...state, selection: { kind: 'pending-card', card } };
    }

    case 'start-badge': {
      const badge = { type: 'temperature', entity: '' } as unknown as BadgeConfig;

      return { ...state, selection: { kind: 'pending-badge', badge } };
    }

    case 'update-pending': {
      const { selection } = state;
      const isBadge = action.value.type === 'temperature';

      if (selection.kind === 'pending-card' && !isBadge) {
        return { ...state, selection: { kind: 'pending-card', card: action.value as CardConfig } };
      }

      if (selection.kind === 'pending-badge' && isBadge) {
        return {
          ...state,
          selection: { kind: 'pending-badge', badge: action.value as BadgeConfig },
        };
      }

      return state;
    }

    case 'commit-pending': {
      return withPending(state) ?? state;
    }

    case 'update-card': {
      if (!inRange(action.index, (currentView(state)?.cards ?? []).length)) {
        return state;
      }

      return changeCurrentView(state, (view) => ({
        ...view,
        cards: (view.cards ?? []).map((card, index) =>
          index === action.index ? action.card : card,
        ),
      }));
    }

    case 'move-card': {
      return moveCard(state, action.index, action.offset);
    }

    case 'delete-card': {
      if (!inRange(action.index, (currentView(state)?.cards ?? []).length)) {
        return state;
      }

      return changeCurrentView(
        state,
        (view) => ({
          ...view,
          cards: (view.cards ?? []).filter((_card, index) => index !== action.index),
        }),
        { selection: viewSelection },
      );
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

      return changeCurrentView(
        state,
        (view) => ({
          ...view,
          badges: (view.badges ?? []).filter((_badge, index) => index !== action.index),
        }),
        { selection: viewSelection },
      );
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
