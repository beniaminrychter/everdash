/** Height of a widget card in the dashboard grid: one row of accessory tiles or two. */
export const cardRows = [1, 2] as const;

export type CardRows = (typeof cardRows)[number];

/** The height a widget card takes when its configuration does not set one. */
export const defaultCardRows: CardRows = 2;

export function isCardRows(value: unknown): value is CardRows {
  return cardRows.includes(value as CardRows);
}
