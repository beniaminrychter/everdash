import type { CardConfig, DashboardDocument } from '@everdash/contracts/config/types';
import type { DashboardCanvasProps } from '@everdash/dashboard/editor/mountDashboardCanvas';
import { hasCardEntity, isCardEntity } from '@everdash/contracts/config/cardDomains';
import { placeholderEntity } from '@/app/draft/builder';
import type { Selection } from '@/app/draft/draftReducer';
import { finishCard, hasIncomplete, isIncomplete } from '@/app/draft/incomplete';
import { cardKindInfo } from './cardKinds';
import { withPreviewTitles } from './previewTitles';

type CanvasSelection = DashboardCanvasProps['selection'];
type CardLocation = NonNullable<DashboardCanvasProps['incomplete']>[number];

interface PendingPreview {
  document: DashboardDocument;
  selection?: CanvasSelection;
  /** The new cards of the current view that still need an entity. */
  incomplete: readonly CardLocation[];
}

/**
 * What a card that is still being added looks like in the preview, by the draft card. The same
 * preview card is returned for the same draft card, so the canvas keeps it as one element while
 * it is dragged, moved or deselected.
 */
const previewCards = new WeakMap<object, CardConfig>();

/**
 * Until an entity is picked a new card uses a placeholder entity and a "New …" name, so it draws
 * like a real card; the draft itself never contains them.
 */
function previewCard(card: CardConfig): CardConfig {
  const cached = previewCards.get(card);

  if (cached) {
    return cached;
  }

  const finished = finishCard(card);
  const label = cardKindInfo(card.type).label.toLowerCase();
  const chosen = hasCardEntity(finished) && isCardEntity(finished.type, finished.entity);
  // A card without an entity, such as the clock, previews exactly as it will be saved.
  const preview = hasCardEntity(finished)
    ? ({
        ...finished,
        entity: chosen ? finished.entity : placeholderEntity(finished.type),
        name: finished.name || (chosen ? undefined : `New ${label}`),
      } as CardConfig)
    : finished;

  previewCards.set(card, preview);

  return preview;
}

function previewList(cards: readonly CardConfig[] | undefined): CardConfig[] | undefined {
  if (!cards || !cards.some(isIncomplete)) {
    return cards ? [...cards] : undefined;
  }

  return cards.map((card) => (isIncomplete(card) ? previewCard(card) : card));
}

/** The draft with its new cards drawn as placeholders. Everything else is the draft itself. */
function withPreviewCards(document: DashboardDocument): DashboardDocument {
  if (!hasIncomplete(document)) {
    return document;
  }

  return {
    ...document,
    views: document.views.map((view) => ({
      ...view,
      cards: previewList(view.cards),
      ...(view.sections
        ? {
            sections: view.sections.map((section) => ({
              ...section,
              cards: previewList(section.cards),
            })),
          }
        : {}),
    })),
  };
}

function incompleteLocations(document: DashboardDocument, viewId: string): CardLocation[] {
  const view = document.views.find((item) => item.id === viewId);
  const found: CardLocation[] = [];

  (view?.cards ?? []).forEach((card, index) => {
    if (isIncomplete(card)) {
      found.push({ section: null, index });
    }
  });

  for (const section of view?.sections ?? []) {
    (section.cards ?? []).forEach((card, index) => {
      if (isIncomplete(card)) {
        found.push({ section: section.id, index });
      }
    });
  }

  return found;
}

/**
 * The document the preview shows. New cards are ordinary cards of the draft and keep their place;
 * they are drawn with a placeholder entity until one is picked. Views or sections with blank names
 * keep fallback preview titles so the canvas stays visible while typing. A badge that is still
 * being added is appended to the current view and shown selected.
 */
export function pendingPreview(
  document: DashboardDocument,
  viewId: string,
  selection: Selection,
): PendingPreview {
  const preview = withPreviewTitles(withPreviewCards(document));
  const incomplete = incompleteLocations(document, viewId);

  if (selection.kind === 'card') {
    return {
      document: preview,
      selection: { kind: 'card', section: selection.section ?? null, index: selection.index },
      incomplete,
    };
  }

  if (selection.kind === 'badge') {
    return { document: preview, selection: { kind: 'badge', index: selection.index }, incomplete };
  }

  if (selection.kind === 'section') {
    return { document: preview, selection: { kind: 'section', section: selection.id }, incomplete };
  }

  const view = preview.views.find((item) => item.id === viewId);

  if (!view || selection.kind !== 'pending-badge') {
    return { document: preview, incomplete };
  }

  const { badge } = selection;
  const chosen = /^sensor\.[a-z0-9_]+$/.test(badge.entity);
  const badgePreview = {
    ...badge,
    entity: chosen ? badge.entity : 'sensor.select_entity',
    name: badge.name || (chosen ? undefined : 'New badge'),
  };
  const badges = [...(view.badges ?? []), badgePreview];

  return {
    document: {
      ...preview,
      views: preview.views.map((item) => (item.id === view.id ? { ...view, badges } : item)),
    },
    selection: { kind: 'badge', index: badges.length - 1 },
    incomplete,
  };
}
