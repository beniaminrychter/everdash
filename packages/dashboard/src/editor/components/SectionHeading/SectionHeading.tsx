import { useState } from 'preact/hooks';
import { useI18n } from '@everdash/ui/i18n/index';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
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
  const { language } = useI18n();
  const locale = { locale: language };
  const [raised, setRaised] = useState(false);
  const name = title || m.editor_untitled_section({}, locale);
  const classes = [styles.bar, selected ? styles.selected : '', raised ? styles.raised : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      <button
        type="button"
        class={styles.handle}
        data-section-handle=""
        aria-label={m.editor_drag_section({ name }, locale)}
        title={m.editor_drag_to_reorder({}, locale)}
      >
        <EditorIcon name="grip" />
      </button>
      <h2 class={`${headingClass} ${styles.heading}`} id={headingId}>
        <button
          type="button"
          class={styles.title}
          aria-pressed={selected}
          aria-label={m.editor_select_section({ name }, locale)}
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
          aria-label={m.editor_edit_section_name({ name }, locale)}
          title={m.editor_edit_section({}, locale)}
          onClick={() => onEvent({ type: 'section.edit', section: id })}
        >
          <EditorIcon name="pencil" />
        </button>
        <EditorMenu
          label={m.editor_more_actions_for_section({ name }, locale)}
          onOpenChange={setRaised}
          items={[
            {
              label: m.editor_rename({}, locale),
              onSelect: () => onEvent({ type: 'section.rename', section: id }),
            },
            {
              label: m.editor_move_up({}, locale),
              disabled: position === 0,
              onSelect: () => onEvent({ type: 'section.move', section: id, offset: -1 }),
            },
            {
              label: m.editor_move_down({}, locale),
              disabled: position === count - 1,
              onSelect: () => onEvent({ type: 'section.move', section: id, offset: 1 }),
            },
            {
              label: m.editor_delete({}, locale),
              danger: true,
              onSelect: () => onEvent({ type: 'section.delete', section: id }),
            },
          ]}
        />
      </div>
    </div>
  );
}
