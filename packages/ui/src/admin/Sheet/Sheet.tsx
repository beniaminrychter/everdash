import type { ComponentChildren } from 'preact';
import { AdminDialog } from '../AdminDialog/AdminDialog';
import styles from './Sheet.module.css';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ComponentChildren;
  onBack?: () => void;
}

export function Sheet({ open, onOpenChange, title, children, onBack }: SheetProps) {
  return (
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className={styles.sheet}
      headerStart={
        onBack && (
          <button type="button" className={styles.back} onClick={onBack}>
            ← Back
          </button>
        )
      }
    >
      {children}
    </AdminDialog>
  );
}
