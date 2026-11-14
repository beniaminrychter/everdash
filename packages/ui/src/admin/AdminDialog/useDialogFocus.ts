import { useLayoutEffect, useRef } from 'preact/hooks';

const dialogs: object[] = [];
let previousOverflow = '';

export function useDialogFocus(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const token = {};
    const returnFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (dialogs.length === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    dialogs.push(token);

    const controls = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex]',
        ) || [],
      ).filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.matches(':disabled') &&
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== 'hidden',
      );
    (controls()[0] || panel.current)?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || dialogs[dialogs.length - 1] !== token) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panel.current?.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panel.current ||
          !panel.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === panel.current ||
          !panel.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      const index = dialogs.indexOf(token);
      const wasTop = index === dialogs.length - 1;
      if (index !== -1) {
        dialogs.splice(index, 1);
      }
      if (dialogs.length === 0) {
        document.body.style.overflow = previousOverflow;
      }
      if (wasTop && returnFocus && document.contains(returnFocus)) {
        returnFocus.focus();
      }
    };
  }, [open]);

  return panel;
}
