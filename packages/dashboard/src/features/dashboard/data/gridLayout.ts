import { defaultCardSize } from '@everdash/contracts/config/cardSize';
import type { CardSize } from '@everdash/contracts/config/cardSize';
import type { ResolvedCard, ResolvedWidget } from './types';
import { isWidget } from './discovery';

/*
 * The one place that decides how wide a card is. The tablet and the editor preview both measure
 * the width of the cards' container and call cardSpan, so the same dashboard lays out identically
 * in a 768px iPad and in a 768px admin preview. The columns are the container's, not the window's.
 */

/** Columns of a card grid. Accessories span 3 (four per row), a third 4, a half 6 and a full row 12. */
export const gridColumns = 12;

/** Space between cards in px; the CSS grid-gap must match it. */
export const gridGap = 16;

const columnsBySize: Readonly<Record<CardSize, number>> = { third: 4, half: 6, full: gridColumns };

/** A widget keeps its size while a column of it is at least this wide (px). */
const minWidgetWidth: Readonly<Record<CardSize, number>> = {
  third: 200,
  half: 280,
  full: 0,
};

/** Container widths (px) at which accessory tiles go from two per row to three, then four. */
const threeTilesFrom = 620;
const fourTilesFrom = 800;

/** The configured size of a widget, or the default for its type. */
export function widgetSize(card: ResolvedWidget): CardSize {
  return ('size' in card && card.size) || defaultCardSize(card.type);
}

/** Whether a widget of this size still has its minimum width in a container of this width. */
function fits(size: CardSize, width: number): boolean {
  const perRow = gridColumns / columnsBySize[size];

  return (width - gridGap * (perRow - 1)) / perRow >= minWidgetWidth[size];
}

/**
 * The size a widget is drawn at: its own while its columns are wide enough, otherwise the next
 * size up. A third stays a third down to about 640px (a column of at least 200px), becomes a half
 * below that and the full row once a half would be narrower than 280px.
 */
export function effectiveSize(size: CardSize, width: number): CardSize {
  if (size === 'third' && fits('third', width)) {
    return 'third';
  }

  if (size !== 'full' && fits('half', width)) {
    return 'half';
  }

  return 'full';
}

/** Columns an accessory tile spans: 3 (four per row), 4 (three per row) or 6 (two per row). */
export function accessorySpan(width: number): number {
  if (width >= fourTilesFrom) {
    return 3;
  }

  return width >= threeTilesFrom ? 4 : 6;
}

/** Columns a widget of this size spans in a container of this width. */
export function widgetSpan(size: CardSize, width: number): number {
  return columnsBySize[effectiveSize(size, width)];
}

/** Columns a card spans in its area's grid, for a container of this width. */
export function cardSpan(card: ResolvedCard, width: number): number {
  return isWidget(card) ? widgetSpan(widgetSize(card), width) : accessorySpan(width);
}
