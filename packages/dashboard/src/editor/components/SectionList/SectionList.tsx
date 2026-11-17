import { useRef } from 'preact/hooks';
import type { SectionListProps } from '../../../features/dashboard/data/editorKit';
import { baseOptions, restoreDrop, sectionGroup, useSortable } from '../../sortable/useSortable';
import styles from './SectionList.module.css';

/** The sections of a view, reordered by dragging a section's handle. */
export function SectionList({ class: className, onEvent, children }: SectionListProps) {
  const list = useRef<HTMLDivElement>(null);
  const report = useRef(onEvent);

  report.current = onEvent;

  useSortable(list, () => ({
    ...baseOptions(),
    group: sectionGroup,
    handle: '[data-section-handle]',
    draggable: '[data-editor-section]',
    ghostClass: styles.ghost,
    fallbackClass: styles.lifted,
    onEnd: (event) => {
      restoreDrop(event);

      const { oldDraggableIndex, newDraggableIndex } = event;
      const section = event.item.dataset.editorSection;

      if (
        !section ||
        oldDraggableIndex === undefined ||
        newDraggableIndex === undefined ||
        oldDraggableIndex === newDraggableIndex
      ) {
        return;
      }

      report.current({ type: 'section.move', section, to: newDraggableIndex });
    },
  }));

  return (
    <div ref={list} class={className}>
      {children}
    </div>
  );
}
