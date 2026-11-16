import SortableLib from 'sortablejs';
import type { Options, SortableEvent } from 'sortablejs';
import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';

/*
 * SortableJS moves DOM nodes itself, but Preact owns this DOM. Every drop therefore puts the node
 * back where Preact left it (restoreDrop) and reports the move; the draft then changes and Preact
 * re-renders the cards in their new order. Instances are created on mount and destroyed on
 * unmount, so a re-render never leaves one attached to a stale element.
 */

/** Cards (and the areas they are in) are sorted with the same `group`, so they move between areas. */
export const cardGroup = 'everdash-cards';
export const sectionGroup = 'everdash-sections';

/** Marks anything inside a card that must not start a drag (its menu and buttons). */
export const noDragSelector = '[data-editor-nodrag]';

/** The drag ended this long ago (ms); the click that follows a drop must not select a card. */
const clickGuardMs = 250;
let lastDragEnd = -clickGuardMs;

export function justDragged(): boolean {
  return performance.now() - lastDragEnd < clickGuardMs;
}

/** Options every list shares: the feel of Home Assistant's own sortable lists. */
export function baseOptions(): Options {
  return {
    animation: 150,
    // The pointer-driven copy behaves the same in every browser and on touch screens.
    forceFallback: true,
    fallbackTolerance: 3,
    delay: 120,
    delayOnTouchOnly: true,
    touchStartThreshold: 4,
    emptyInsertThreshold: 16,
    filter: noDragSelector,
    preventOnFilter: false,
  };
}

/** Puts the dragged node back in the list and position Preact rendered it in. */
export function restoreDrop(event: SortableEvent) {
  const { item, from, oldIndex } = event;

  const next = from.children[oldIndex ?? 0];

  item.remove();

  // `next` is the card that followed the dragged one before the drag, now at its index again.
  if (next && next !== item) {
    next.before(item);
  } else {
    from.append(item);
  }

  lastDragEnd = performance.now();
}

/** Marks the editor surface while a card is dragged, so empty areas can say "Drop here". */
export function setSorting(list: HTMLElement, sorting: boolean) {
  const surface = list.closest<HTMLElement>('[data-editor-surface]');

  if (!surface) {
    return;
  }

  if (sorting) {
    surface.dataset.sorting = '';
  } else {
    delete surface.dataset.sorting;
  }
}

/** A list's section id (the empty string is the cards outside any section). */
export function areaSection(list: HTMLElement): string | null {
  return list.dataset.editorArea || null;
}

/** Creates a Sortable for the element while the component is mounted. */
export function useSortable(element: RefObject<HTMLElement>, options: () => Options) {
  // The options read the latest props through refs, so they are fixed for the element's life.
  const create = useRef(options);

  useEffect(() => {
    const target = element.current;

    if (!target) {
      return undefined;
    }

    const sortable = SortableLib.create(target, create.current());

    return () => sortable.destroy();
  }, [element]);
}
