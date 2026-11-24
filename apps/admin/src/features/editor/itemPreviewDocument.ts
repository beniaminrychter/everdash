import { hasCardEntity, isCardEntity } from '@everdash/contracts/config/cardDomains';
import type { DashboardDocument, ViewConfig } from '@everdash/contracts/config/types';
import type { Selection } from '../../app/draft/draftReducer';
import { pendingPreview, previewCard } from './pendingPreview';

/**
 * The dashboard shown beside the editor form: the same document with a single view that holds
 * only the item being edited, so the real tablet canvas draws just that card, badge or section.
 * Items still being added keep their placeholder entity and "New …" name. The view settings and
 * items that no longer exist have nothing to preview.
 */
export function itemPreviewDocument(
  document: DashboardDocument,
  viewId: string,
  selection: Selection,
): DashboardDocument | null {
  const { document: preview, selection: shown } = pendingPreview(document, viewId, selection);
  const view = preview.views.find((item) => item.id === viewId);

  if (!view || !shown) {
    return null;
  }

  const base = { id: view.id, title: view.title };
  const only = (item: ViewConfig): DashboardDocument => ({ ...preview, views: [item] });

  if (shown.kind === 'card') {
    const list =
      shown.section === null
        ? view.cards
        : view.sections?.find((section) => section.id === shown.section)?.cards;
    const card = list?.[shown.index];

    if (!card) {
      return null;
    }

    // A card whose entity is not chosen yet, such as after a type change, is drawn as a new card.
    const unchosen = hasCardEntity(card) && !isCardEntity(card.type, card.entity);

    return only({ ...base, cards: [unchosen ? previewCard(card) : card] });
  }

  if (shown.kind === 'badge') {
    const badge = view.badges?.[shown.index];

    return badge ? only({ ...base, badges: [badge] }) : null;
  }

  const section = view.sections?.find((item) => item.id === shown.section);

  return section ? only({ ...base, sections: [section] }) : null;
}
