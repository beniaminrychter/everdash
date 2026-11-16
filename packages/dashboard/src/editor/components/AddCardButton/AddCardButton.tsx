import type { AddCardButtonProps } from '../../../features/dashboard/data/editorKit';
import styles from './AddCardButton.module.css';

export function AddCardButton({ label, section, onEvent }: AddCardButtonProps) {
  return (
    <button
      type="button"
      class={styles.addCard}
      aria-label={label}
      onClick={() => onEvent({ type: 'card.add', section })}
    >
      + Add card
    </button>
  );
}
