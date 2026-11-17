import { useState } from 'preact/hooks';
import type { SectionHeadingProps } from '../../../features/dashboard/data/editorKit';
import { EditorIcon } from '../EditorIcon/EditorIcon';
import { EditorMenu } from '../EditorMenu/EditorMenu';
import styles from './SectionHeading.module.css';

/**
 * A section's heading with its editor chrome: a handle to drag the section, and (on hover, on
 * focus and while selected) a pencil and a ⋮ menu. Clicking the title selects the section.
 */
export function SectionHeading({
  id,
  headingId,
  headingClass,
  title,
  selected,
  position,
  count,
  onEvent,
}: SectionHeadingProps) {
  const [raised, setRaised] = useState(false);
  const name = title || 'Untitled section';
  const classes = [styles.bar, selected ? styles.selected : '', raised ? styles.raised : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      <button
        type="button"
        class={styles.handle}
        data-section-handle=""
        aria-label={`Drag section ${name}`}
        title="Drag to reorder"
      >
        <EditorIcon name="grip" />
      </button>
      <h2 class={`${headingClass} ${styles.heading}`} id={headingId}>
        <button
          type="button"
          class={styles.title}
          aria-pressed={selected}
          aria-label={`Select section ${name}`}
          onClick={() => onEvent({ type: 'section.edit', section: id })}
        >
          {name}
        </button>
      </h2>
      <div class={styles.actions} data-editor-nodrag="">
        <button
          type="button"
          class={styles.action}
          data-editor-select=""
          aria-label={`Edit section ${name}`}
          title="Edit section"
          onClick={() => onEvent({ type: 'section.edit', section: id })}
        >
          <EditorIcon name="pencil" />
        </button>
        <EditorMenu
          label={`More actions for section ${name}`}
          onOpenChange={setRaised}
          items={[
            {
              label: 'Rename',
              onSelect: () => onEvent({ type: 'section.rename', section: id }),
            },
            {
              label: 'Move up',
              disabled: position === 0,
              onSelect: () => onEvent({ type: 'section.move', section: id, offset: -1 }),
            },
            {
              label: 'Move down',
              disabled: position === count - 1,
              onSelect: () => onEvent({ type: 'section.move', section: id, offset: 1 }),
            },
            {
              label: 'Delete',
              danger: true,
              onSelect: () => onEvent({ type: 'section.delete', section: id }),
            },
          ]}
        />
      </div>
    </div>
  );
}
