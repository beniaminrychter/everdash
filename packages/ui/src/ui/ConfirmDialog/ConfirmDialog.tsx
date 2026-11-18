import { Modal } from '../Modal/Modal';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  closeLabel,
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} closeLabel={closeLabel} onClose={onCancel}>
      <p class={styles.description}>{description}</p>
      <div class={styles.actions}>
        <button type="button" class={styles.cancel} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          class={`${styles.confirm} ${tone === 'danger' ? styles.danger : ''}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
