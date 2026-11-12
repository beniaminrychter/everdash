import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  eyebrow?: string;
  closeLabel: string;
  onClose: () => void;
  children: ComponentChildren;
}

export function Modal({ title, eyebrow, closeLabel, onClose, children }: ModalProps) {
  const sheet = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useLayoutEffect(() => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () =>
      [
        ...(sheet.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex="0"]',
        ) || []),
      ].filter(
        (element) =>
          element.getAttribute('tabindex') !== '-1' && element.getClientRects().length > 0,
      );
    const focusable = controls();
    (focusable?.[0] || sheet.current)?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const items = controls();
      if (!items?.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      if (returnFocus.current && document.contains(returnFocus.current)) {
        returnFocus.current.focus();
      }
    };
  }, []);

  return (
    // Escape and the close button provide keyboard dismissal; only direct backdrop clicks dismiss.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      class={styles.modalBackdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        class={styles.sheet}
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        tabIndex={-1}
      >
        <div class={styles.sheetHeader}>
          <div>
            {eyebrow && <span class={styles.sheetEyebrow}>{eyebrow}</span>}
            <h2 id="sheet-title">{title}</h2>
          </div>
          <IconButton label={closeLabel} onClick={onClose} className={styles.roundButton}>
            <Icon name="close" />
          </IconButton>
        </div>
        {children}
      </section>
    </div>
  );
}
