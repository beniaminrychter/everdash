import { useLayoutEffect } from 'preact/hooks';
import type { RefObject } from 'preact';
import { gridGap } from '../data/gridLayout';

/*
 * Cards of different heights share a row without stretching it: a tall card (the weather forecast)
 * beside short tiles lets the tiles that follow tuck in under the first ones. The grid is made of
 * 1px rows and every card spans as many of them as it is tall (plus the space below it), so the
 * automatic placement puts each card in the first free spot instead of below the tallest card of
 * the previous row. The heights are measured from the DOM, so a card needs no height of its own.
 * Until a grid has been measured it keeps ordinary rows, so nothing overlaps while it loads.
 */

/** Set on a grid once it has been measured; the CSS only uses 1px rows from then on. */
const packedAttribute = 'data-packed';

/** The space below a card in px: the grid's own gap, which narrow screens shrink. */
function cardGap(grid: HTMLElement): number {
  const gap = Number(
    window.getComputedStyle(grid).getPropertyValue('grid-column-gap').replace('px', ''),
  );

  return gap > 0 ? Math.ceil(gap) : gridGap;
}

/** Snaps standard 1-row and 2-row card heights so two stacked 1-row tiles match one 2-row widget. */
function snapCardHeight(height: number, gap: number, grid: HTMLElement): number {
  const narrow =
    Boolean(grid.closest('[data-bp-599]')) ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 599px)').matches);
  const oneRow = narrow ? 100 : 104;
  const twoRows = oneRow * 2 + gap;

  if (Math.abs(height - oneRow) <= 2) {
    return oneRow;
  }

  if (Math.abs(height - twoRows) <= 2) {
    return twoRows;
  }

  return height;
}

/** Gives every card of the grid the rows its height needs. */
export function packGrid(grid: HTMLElement) {
  const cards = Array.from(grid.children) as HTMLElement[];

  // An empty area keeps its ordinary rows: it is a drop zone with a height of its own.
  if (cards.length === 0) {
    grid.removeAttribute(packedAttribute);

    return;
  }

  const gap = cardGap(grid);

  // Measure everything before changing anything, so the browser lays out only once.
  const heights = cards.map((card) => snapCardHeight(card.offsetHeight, gap, grid));

  cards.forEach((card, index) => {
    const rows = `span ${heights[index] + gap}`;

    // The row spans stay on the nodes SortableJS moves, so a card keeps its height while dragged.
    if (card.style.gridRowEnd !== rows) {
      card.style.gridRowEnd = rows;
    }
  });

  if (!grid.hasAttribute(packedAttribute)) {
    grid.setAttribute(packedAttribute, '');
  }
}

/** Packs every card grid (the elements with this class) inside the root. */
function packGrids(root: HTMLElement | null, gridClass: string) {
  if (!root) {
    return;
  }

  for (const grid of Array.from(root.querySelectorAll<HTMLElement>(`.${gridClass}`))) {
    packGrid(grid);
  }
}

/**
 * Packs the card grids inside the element (the ones with this class) after every render, when the
 * window changes size and when the text inside a card changes (a clock ticking, a forecast
 * loading). ResizeObserver is missing on iOS 12, so a changed card is found by what it renders.
 */
export function usePackedGrids(element: RefObject<HTMLElement>, gridClass: string) {
  // After every render, before the browser paints: new and reordered cards get their rows at once.
  useLayoutEffect(() => {
    packGrids(element.current, gridClass);
  });

  useLayoutEffect(() => {
    const root = element.current;
    let frame = 0;

    const schedule = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        packGrids(root, gridClass);
      });
    };

    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.addEventListener('load', schedule);

    const observer =
      typeof MutationObserver === 'undefined' ? null : new MutationObserver(schedule);

    if (root) {
      observer?.observe(root, { characterData: true, childList: true, subtree: true });
    }

    // Web fonts change the width of text, and with it the height of a card, after the first paint.
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;

    if (fonts) {
      fonts.ready.then(schedule).catch(schedule);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.removeEventListener('load', schedule);
      observer?.disconnect();
    };
  }, [element, gridClass]);
}
