import type { CardConfig } from './types';

/** Width of a widget card in the dashboard grid: a quarter, a half or the full row. */
export const cardSizes = ['quarter', 'half', 'full'] as const;

export type CardSize = (typeof cardSizes)[number];

const defaultSizeByType: Readonly<Partial<Record<CardConfig['type'], CardSize>>> = {
  clock: 'quarter',
  pstryk: 'half',
  climate: 'half',
};

/** The size a widget card takes when its configuration does not set one. */
export function defaultCardSize(type: CardConfig['type']): CardSize {
  return defaultSizeByType[type] ?? 'full';
}

export function isCardSize(value: unknown): value is CardSize {
  return cardSizes.includes(value as CardSize);
}
