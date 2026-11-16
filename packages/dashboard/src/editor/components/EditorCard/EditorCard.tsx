import { useState } from 'preact/hooks';
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

  const items: MenuItem[] = [{ label: 'Edit', onSelect: edit }];

  if (sections.length > 0) {
    items.push({
      label: 'Move to section',
      onSelect: () => undefined,
      choices: [
        {
          label: 'No section',
          current: section === null,
          onSelect: () =>
            onEvent({ type: 'card.move', section, index, toSection: null, toEnd: true }),
        },
        ...sections.map((choice) => ({
          label: choice.title || 'Untitled section',
          current: section === choice.id,
          onSelect: () =>
            onEvent({ type: 'card.move', section, index, toSection: choice.id, toEnd: true }),
        })),
      ],
    });
  }

  items.push(
    {
      label: 'Move earlier',
      disabled: index === 0,
      onSelect: () => onEvent({ type: 'card.move', section, index, offset: -1 }),
    },
    {
      label: 'Move later',
      disabled: index >= count - 1,
      onSelect: () => onEvent({ type: 'card.move', section, index, offset: 1 }),
    },
    {
      label: 'Duplicate',
      disabled: incomplete,
      onSelect: () => onEvent({ type: 'card.duplicate', section, index }),
    },
    {
      label: 'Delete',
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
          aria-label={`Select ${name}`}
          aria-pressed={selected}
          onClick={() => {
            if (!justDragged()) {
              edit();
            }
          }}
        />
        {incomplete && (
          <span class={styles.hint}>
            {type === 'clock' ? 'Press Add card to finish' : 'Choose an entity'}
          </span>
        )}
        <div class={styles.actions} data-editor-nodrag="">
          <button
            type="button"
            class={styles.action}
            data-editor-select=""
            aria-label={`Edit ${name}`}
            title="Edit"
            onClick={edit}
          >
            <EditorIcon name="pencil" />
          </button>
          <EditorMenu label={`More actions for ${name}`} items={items} onOpenChange={setRaised} />
        </div>
      </div>
    </div>
  );
}
