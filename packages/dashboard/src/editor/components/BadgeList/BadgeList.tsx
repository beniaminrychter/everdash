import { useRef } from 'preact/hooks';
import type { BadgeListProps } from '../../../features/dashboard/data/editorKit';
import { badgeGroup, baseOptions, restoreDrop, useSortable } from '../../sortable/useSortable';
import styles from './BadgeList.module.css';

/**
 * The view's badges, made sortable. SortableJS moves the badge's node while it is dragged; on drop
 * the node goes back where Preact had it and the move is reported, and the re-render puts it in
 * its new place. Badges sort only among themselves.
 */
export function BadgeList({ class: className, onEvent, children }: BadgeListProps) {
  const list = useRef<HTMLDivElement>(null);
  const report = useRef(onEvent);

  report.current = onEvent;

  useSortable(list, () => ({
    ...baseOptions(),
    group: badgeGroup,
    draggable: '[data-editor-badge]',
    ghostClass: styles.ghost,
    fallbackClass: styles.lifted,
    onEnd: (event) => {
      restoreDrop(event);

      const { oldDraggableIndex, newDraggableIndex } = event;

      if (
        oldDraggableIndex === undefined ||
        newDraggableIndex === undefined ||
        oldDraggableIndex === newDraggableIndex
      ) {
        return;
      }

      report.current({ type: 'badge.move', index: oldDraggableIndex, to: newDraggableIndex });
    },
  }));

  return (
    <div ref={list} class={className}>
      {children}
    </div>
  );
}
