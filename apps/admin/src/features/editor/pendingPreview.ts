import type { CardConfig, DashboardDocument } from '@everdash/contracts/config/types';
import { isCardEntity } from '@everdash/contracts/config/cardDomains';
import { createCard } from '@/app/draft/builder';
import type { Selection } from '@/app/draft/draftReducer';
import { cardKindInfo } from './cardKinds';

interface PendingPreview {
  document: DashboardDocument;
  selection?: { kind: 'card' | 'badge'; index: number };
}

function replaceView(
  document: DashboardDocument,
  view: DashboardDocument['views'][number],
): DashboardDocument {
  return {
    ...document,
    views: document.views.map((item) => (item.id === view.id ? view : item)),
  };
}

/**
 * The document the preview shows. A card or badge that is still being added is appended to the
 * current view, so it appears (selected) as soon as its type is chosen. Until an entity is picked
 * it uses a placeholder entity and a "New …" name; the saved draft never contains these.
 */
export function pendingPreview(
  document: DashboardDocument,
  viewId: string,
  selection: Selection,
): PendingPreview {
  if (selection.kind === 'card' || selection.kind === 'badge') {
    return { document, selection: { kind: selection.kind, index: selection.index } };
  }

  const view = document.views.find((item) => item.id === viewId);

  if (!view || (selection.kind !== 'pending-card' && selection.kind !== 'pending-badge')) {
    return { document };
  }

  if (selection.kind === 'pending-card') {
    const { card } = selection;
    const chosen = isCardEntity(card.type, card.entity);
    const label = cardKindInfo(card.type).label.toLowerCase();
    const preview = {
      ...card,
      entity: chosen ? card.entity : createCard(card.type).entity,
      name: card.name || (chosen ? undefined : `New ${label}`),
    } as CardConfig;
    const cards = [...(view.cards ?? []), preview];

    return {
      document: replaceView(document, { ...view, cards }),
      selection: { kind: 'card', index: cards.length - 1 },
    };
  }

  const { badge } = selection;
  const chosen = /^sensor\.[a-z0-9_]+$/.test(badge.entity);
  const preview = {
    ...badge,
    entity: chosen ? badge.entity : 'sensor.select_entity',
    name: badge.name || (chosen ? undefined : 'New badge'),
  };
  const badges = [...(view.badges ?? []), preview];

  return {
    document: replaceView(document, { ...view, badges }),
    selection: { kind: 'badge', index: badges.length - 1 },
  };
}
