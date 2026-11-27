import { useState } from 'preact/hooks';
import { useI18n } from '@everdash/ui/i18n/index';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
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
  const { language } = useI18n();
  const locale = { locale: language };
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
    { label: m.editor_edit({}, locale), onSelect: edit },
    {
      label: m.editor_move_earlier({}, locale),
      disabled: index === 0,
      onSelect: () => onEvent({ type: 'badge.move', index, offset: -1 }),
    },
    {
      label: m.editor_move_later({}, locale),
      disabled: index >= count - 1,
      onSelect: () => onEvent({ type: 'badge.move', index, offset: 1 }),
    },
    {
      label: m.editor_duplicate({}, locale),
      onSelect: () => onEvent({ type: 'badge.duplicate', index }),
    },
    {
      label: m.editor_delete({}, locale),
      danger: true,
      onSelect: () => onEvent({ type: 'badge.delete', index }),
    },
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
          aria-label={m.editor_edit_item({ name }, locale)}
          aria-pressed={selected}
          onClick={() => {
            if (!justDragged()) {
              edit();
            }
          }}
        />
        <div class={styles.actions} data-editor-nodrag="">
          <EditorMenu
            label={m.editor_more_actions_for({ name }, locale)}
            items={items}
            onOpenChange={setRaised}
          />
        </div>
      </div>
    </div>
  );
}
