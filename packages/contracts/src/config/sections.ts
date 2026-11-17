interface CardList<Card> {
  cards?: readonly Card[];
  sections?: readonly { cards?: readonly Card[] }[];
}

/** Every card of a view in display order: the unsectioned cards, then each section's cards. */
export function viewCards<Card>(view: CardList<Card>): Card[] {
  const cards: Card[] = [...(view.cards || [])];

  for (const section of view.sections || []) {
    cards.push(...(section.cards || []));
  }

  return cards;
}
