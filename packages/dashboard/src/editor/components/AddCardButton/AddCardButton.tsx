import { useI18n } from '@everdash/ui/i18n/index';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import type { AddCardButtonProps } from '../../../features/dashboard/data/editorKit';
import styles from './AddCardButton.module.css';

export function AddCardButton({ label, section, onEvent }: AddCardButtonProps) {
  const { language } = useI18n();

  return (
    <button
      type="button"
      class={styles.addCard}
      aria-label={label}
      onClick={() => onEvent({ type: 'card.add', section })}
    >
      {m.editor_add_card_button({}, { locale: language })}
    </button>
  );
}
