import type { CardConfig, DashboardDocument, ViewConfig } from '@everdash/contracts/config/types';

/*
 * A card that was just added and still needs an entity is an ordinary card in its view's list,
 * carrying a draft-only `incomplete` marker. It moves, is duplicated away from, is deleted and
 * is edited like any other card; only saving cares. The marker never reaches the saved dashboard,
 * the preview or the JSON page: Save is blocked while one exists, and the other places read the
 * document through the functions below.
 */

export type DraftCard = CardConfig & { incomplete?: true };

export function isIncomplete(card: CardConfig): boolean {
  return (card as DraftCard).incomplete === true;
}

export function markIncomplete(card: CardConfig): CardConfig {
  return { ...card, incomplete: true } as DraftCard as CardConfig;
}

/** The card without the marker. */
export function finishCard(card: CardConfig): CardConfig {
  const { incomplete: _marker, ...rest } = card as DraftCard;

  return rest as CardConfig;
}

/** Carries the marker of the card being replaced over to its replacement. */
export function keepMarker(previous: CardConfig, next: CardConfig): CardConfig {
  return isIncomplete(previous) ? markIncomplete(finishCard(next)) : finishCard(next);
}

function mapView(
  document: DashboardDocument,
  change: (cards: readonly CardConfig[]) => readonly CardConfig[],
): DashboardDocument {
  const views = document.views.map((view): ViewConfig => {
    const cards = view.cards ?? [];
    const sections = view.sections;
    const changed = change(cards);
    const sectionsChanged = sections?.map((section) => ({
      ...section,
      cards: change(section.cards ?? []),
    }));

    return {
      ...view,
      cards: changed,
      ...(sectionsChanged ? { sections: sectionsChanged } : {}),
    };
  });

  return { ...document, views };
}

/** Whether any card of the dashboard is still being added. */
export function hasIncomplete(document: DashboardDocument): boolean {
  return document.views.some(
    (view) =>
      (view.cards ?? []).some(isIncomplete) ||
      (view.sections ?? []).some((section) => (section.cards ?? []).some(isIncomplete)),
  );
}

/** The views that hold a card still being added. */
export function viewsWithIncomplete(document: DashboardDocument): ViewConfig[] {
  return document.views.filter(
    (view) =>
      (view.cards ?? []).some(isIncomplete) ||
      (view.sections ?? []).some((section) => (section.cards ?? []).some(isIncomplete)),
  );
}

/** The dashboard as it would be saved if the cards still being added were left out. */
export function withoutIncomplete(document: DashboardDocument): DashboardDocument {
  if (!hasIncomplete(document)) {
    return document;
  }

  return mapView(document, (cards) => cards.filter((card) => !isIncomplete(card)));
}

/** The dashboard with every marker removed, for the places that must never see one. */
export function withoutMarkers(document: DashboardDocument): DashboardDocument {
  if (!hasIncomplete(document)) {
    return document;
  }

  return mapView(document, (cards) => cards.map(finishCard));
}
