import { useState } from 'preact/hooks';
import type { EditorBadgeProps } from '../../../features/dashboard/data/editorKit';
import { justDragged } from '../../sortable/useSortable';
import { EditorMenu } from '../EditorMenu/EditorMenu';
import type { MenuItem } from '../EditorMenu/EditorMenu';
import styles from './EditorBadge.module.css';

/**
 * One badge in the editor. The whole pill is the drag handle and a click without movement opens
 * it in the inspector. Its own content is inert, so nothing in it reacts while editing. The ⋮ menu
 * sits on the pill's top right corner and appears on hover, on focus and while the badge is
 * selected (always on touch screens).
 */
export function EditorBadge({
  index,
  count,
  name,
  selected,
  class: className,
  onEvent,
  children,
}: EditorBadgeProps) {
  const [raised, setRaised] = useState(false);
  const edit = () => onEvent({ type: 'badge.edit', index });
  const classes = [
    styles.cell,
    selected ? styles.selected : '',
    raised ? styles.raised : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const items: MenuItem[] = [
    { label: 'Edit', onSelect: edit },
    {
      label: 'Move earlier',
      disabled: index === 0,
      onSelect: () => onEvent({ type: 'badge.move', index, offset: -1 }),
    },
    {
      label: 'Move later',
      disabled: index >= count - 1,
      onSelect: () => onEvent({ type: 'badge.move', index, offset: 1 }),
    },
    { label: 'Duplicate', onSelect: () => onEvent({ type: 'badge.duplicate', index }) },
    { label: 'Delete', danger: true, onSelect: () => onEvent({ type: 'badge.delete', index }) },
  ];

  return (
    <div class={classes} data-editor-badge="">
      <div class={styles.pill}>
        <div class={styles.content} inert>
          {children}
        </div>
        <button
          type="button"
          class={styles.layer}
          data-editor-select=""
          aria-label={`Edit ${name}`}
          aria-pressed={selected}
          onClick={() => {
            if (!justDragged()) {
              edit();
            }
          }}
        />
        <div class={styles.actions} data-editor-nodrag="">
          <EditorMenu label={`More actions for ${name}`} items={items} onOpenChange={setRaised} />
        </div>
      </div>
    </div>
  );
}
