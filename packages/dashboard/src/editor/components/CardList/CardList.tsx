import { useRef } from 'preact/hooks';
import { useI18n } from '@everdash/ui/i18n/index';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import type { CardListProps } from '../../../features/dashboard/data/editorKit';
import {
  areaSection,
  baseOptions,
  cardGroup,
  restoreDrop,
  setSorting,
  useSortable,
} from '../../sortable/useSortable';
import styles from './CardList.module.css';

/** The area a drag is over, so an empty one can light up as the place the card will go. */
let over: HTMLElement | null = null;

function markOver(list: HTMLElement | null) {
  if (over === list) {
    return;
  }

  if (over) {
    delete over.dataset.over;
  }

  over = list;

  if (over) {
    over.dataset.over = '';
  }
}

/**
 * One area's grid of cards, made sortable. An empty area is a visible drop zone. SortableJS moves
 * the card's node while it is dragged; on drop the node goes back where Preact had it and the
 * move is reported, and the re-render puts it in its new place.
 */
export function CardList({
  section,
  class: className,
  empty,
  emptyLabel,
  onEvent,
  children,
}: CardListProps) {
  const { language } = useI18n();
  const list = useRef<HTMLDivElement>(null);
  const report = useRef(onEvent);

  report.current = onEvent;

  useSortable(list, () => ({
    ...baseOptions(),
    group: cardGroup,
    draggable: '[data-editor-card]',
    ghostClass: styles.ghost,
    fallbackClass: styles.lifted,
    onStart: (event) => {
      setSorting(event.from, true);
    },
    onMove: (event) => {
      markOver(event.to);
    },
    onEnd: (event) => {
      setSorting(event.from, false);
      markOver(null);
      restoreDrop(event);

      const { oldDraggableIndex, newDraggableIndex } = event;

      if (oldDraggableIndex === undefined || newDraggableIndex === undefined) {
        return;
      }

      if (event.from === event.to && oldDraggableIndex === newDraggableIndex) {
        return;
      }

      report.current({
        type: 'card.move',
        section: areaSection(event.from),
        index: oldDraggableIndex,
        toSection: areaSection(event.to),
        to: newDraggableIndex,
      });
    },
  }));

  return (
    <div class={styles.zone}>
      <div
        ref={list}
        class={empty ? `${className} ${styles.empty}` : className}
        data-editor-area={section ?? ''}
      >
        {children}
      </div>
      {empty && (
        <p class={styles.hint}>
          <span class={styles.idle}>{emptyLabel}</span>
          <span class={styles.drop}>{m.editor_drop_here({}, { locale: language })}</span>
        </p>
      )}
    </div>
  );
}
