import { useState } from 'preact/hooks';
import { useI18n } from '@everdash/ui/i18n/index';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import type { EditorCardProps } from '../../../features/dashboard/data/editorKit';
import { justDragged } from '../../sortable/useSortable';
import { EditorIcon } from '../EditorIcon/EditorIcon';
import { EditorMenu } from '../EditorMenu/EditorMenu';
import type { MenuItem } from '../EditorMenu/EditorMenu';
import styles from './EditorCard.module.css';

/**
 * One card in the editor's grid. The cell is the grid item SortableJS drags: the whole card is
 * the drag handle, and a click without movement selects it. The card's own controls sit under a
 * transparent select layer and are inert, so nothing in it toggles a device while editing. The
 * pencil and ⋮ menu appear on hover, on focus and while the card is selected.
 */
export function EditorCard({
  section,
  index,
  count,
  name,
  type,
  selected,
  incomplete,
  sections,
  class: className,
  style,
  dataset,
  onEvent,
  children,
}: EditorCardProps) {
  const { language } = useI18n();
  const locale = { locale: language };
  const [raised, setRaised] = useState(false);
  const edit = () => onEvent({ type: 'card.edit', section, index });
  const classes = [
    styles.cell,
    selected ? styles.selected : '',
    incomplete ? styles.incomplete : '',
    raised ? styles.raised : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const items: MenuItem[] = [{ label: m.editor_edit({}, locale), onSelect: edit }];

  if (sections.length > 0) {
    items.push({
      label: m.editor_move_to_section({}, locale),
      onSelect: () => undefined,
      choices: [
        {
          label: m.editor_no_section({}, locale),
          current: section === null,
          onSelect: () =>
            onEvent({ type: 'card.move', section, index, toSection: null, toEnd: true }),
        },
        ...sections.map((choice) => ({
          label: choice.title || m.editor_untitled_section({}, locale),
          current: section === choice.id,
          onSelect: () =>
            onEvent({ type: 'card.move', section, index, toSection: choice.id, toEnd: true }),
        })),
      ],
    });
  }

  items.push(
    {
      label: m.editor_move_earlier({}, locale),
      disabled: index === 0,
      onSelect: () => onEvent({ type: 'card.move', section, index, offset: -1 }),
    },
    {
      label: m.editor_move_later({}, locale),
      disabled: index >= count - 1,
      onSelect: () => onEvent({ type: 'card.move', section, index, offset: 1 }),
    },
    {
      label: m.editor_duplicate({}, locale),
      disabled: incomplete,
      onSelect: () => onEvent({ type: 'card.duplicate', section, index }),
    },
    {
      label: m.editor_delete({}, locale),
      danger: true,
      onSelect: () => onEvent({ type: 'card.delete', section, index }),
    },
  );

  return (
    <div class={classes} style={style} data-editor-card="" {...dataset}>
      <div class={styles.card}>
        <div class={styles.content} inert>
          {children}
        </div>
        <button
          type="button"
          class={styles.layer}
          data-editor-select=""
          aria-label={m.editor_select_item({ name }, locale)}
          aria-pressed={selected}
          onClick={() => {
            if (!justDragged()) {
              edit();
            }
          }}
        />
        {incomplete && (
          <span class={styles.hint}>
            {type === 'clock'
              ? m.editor_hint_press_add_card({}, locale)
              : m.editor_hint_choose_entity({}, locale)}
          </span>
        )}
        <div class={styles.actions} data-editor-nodrag="">
          <button
            type="button"
            class={styles.action}
            data-editor-select=""
            aria-label={m.editor_edit_item({ name }, locale)}
            title={m.editor_edit({}, locale)}
            onClick={edit}
          >
            <EditorIcon name="pencil" />
          </button>
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
