/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Safari 12 does not support native dialog. */
import type { ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';
import { useDialogFocus } from './useDialogFocus';
import styles from './AdminDialog.module.css';

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ComponentChildren;
  className?: string;
  headerStart?: ComponentChildren;
}

export function AdminDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  headerStart,
}: AdminDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panel = useDialogFocus(open, () => onOpenChange(false));

  if (!open) {
    return null;
  }

  return (
    // Escape and the close button provide keyboard dismissal.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <section
        ref={panel}
        className={[styles.dialog, className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <header className={styles.header}>
          {headerStart}
          <div className={styles.heading}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            )}
          </div>
          <button type="button" className={styles.close} onClick={() => onOpenChange(false)}>
            Close
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
