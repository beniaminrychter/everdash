/* oxlint-disable react/refs -- Preact context carries DOM refs for event handlers. */
import { createContext } from 'preact';
import type { ComponentChildren, JSX, RefObject } from 'preact';
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import styles from './DropdownMenu.module.css';

type FocusEdge = 'first' | 'last';
interface MenuContext {
  open: boolean;
  setOpen: (open: boolean) => void;
  trigger: RefObject<HTMLButtonElement>;
  content: RefObject<HTMLDivElement>;
  triggerId: string;
  contentId: string;
  pendingFocus: RefObject<FocusEdge>;
  setTrigger: (node: HTMLButtonElement | null) => void;
  setContent: (node: HTMLDivElement | null) => void;
}

const Context = createContext<MenuContext | undefined>(undefined);

function useMenu() {
  const menu = useContext(Context);
  if (!menu) {
    throw new Error('DropdownMenu components must be used within DropdownMenu');
  }
  return menu;
}

function focusItem(content: HTMLDivElement | null, edge: FocusEdge) {
  const items = content?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)');
  if (items && items.length > 0) {
    items[edge === 'first' ? 0 : items.length - 1].focus();
  }
}

export function DropdownMenu({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
}: {
  children: ComponentChildren;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open === undefined ? internalOpen : open;
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<FocusEdge>(null);
  const id = useId();
  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) {
        setInternalOpen(next);
      }
      if (next !== isOpen) {
        onOpenChange?.(next);
      }
    },
    [open, isOpen, onOpenChange],
  );
  const setTrigger = useCallback((node: HTMLButtonElement | null) => {
    trigger.current = node;
  }, []);
  const setContent = useCallback((node: HTMLDivElement | null) => {
    content.current = node;
  }, []);
  const context = useMemo(
    () => ({
      open: isOpen,
      setOpen,
      trigger,
      content,
      triggerId: `${id}-trigger`,
      contentId: `${id}-menu`,
      pendingFocus,
      setTrigger,
      setContent,
    }),
    [isOpen, setOpen, id, setTrigger, setContent],
  );

  useLayoutEffect(() => {
    if (isOpen && pendingFocus.current) {
      focusItem(content.current, pendingFocus.current);
      pendingFocus.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const closeOutside = (event: MouseEvent | TouchEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const target = event.target as Node | null;
      if (target && !trigger.current?.contains(target) && !content.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('touchstart', closeOutside);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('touchstart', closeOutside);
    };
  });

  return (
    <Context.Provider value={context}>
      <span className={styles.root}>{children}</span>
    </Context.Provider>
  );
}

export function DropdownMenuTrigger({
  className,
  onClick,
  onKeyDown,
  disabled,
  ...props
}: JSX.IntrinsicElements['button']) {
  const menu = useMenu();
  return (
    <button
      {...props}
      ref={menu.setTrigger}
      id={menu.triggerId}
      type="button"
      disabled={disabled}
      className={[styles.trigger, className].filter(Boolean).join(' ')}
      aria-haspopup="menu"
      aria-expanded={menu.open}
      aria-controls={menu.contentId}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) {
          menu.setOpen(!menu.open);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) {
          return;
        }
        if (
          event.key === 'ArrowDown' ||
          event.key === 'ArrowUp' ||
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          const edge = event.key === 'ArrowUp' ? 'last' : 'first';
          if (menu.open) {
            focusItem(menu.content.current, edge);
          } else {
            menu.pendingFocus.current = edge;
            menu.setOpen(true);
          }
        }
      }}
    />
  );
}

export function DropdownMenuContent({
  className,
  align = 'start',
  onKeyDown,
  ...props
}: JSX.IntrinsicElements['div'] & { align?: 'start' | 'end' }) {
  const menu = useMenu();
  if (!menu.open) {
    return null;
  }
  return (
    <div
      {...props}
      ref={menu.setContent}
      id={menu.contentId}
      role="menu"
      tabIndex={-1}
      aria-labelledby={menu.triggerId}
      className={[styles.content, align === 'end' ? styles.end : styles.start, className]
        .filter(Boolean)
        .join(' ')}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          menu.setOpen(false);
          menu.trigger.current?.focus();
          return;
        }
        if (event.key === 'Tab') {
          menu.trigger.current?.focus();
          menu.setOpen(false);
          return;
        }
        if (
          event.key !== 'ArrowDown' &&
          event.key !== 'ArrowUp' &&
          event.key !== 'Home' &&
          event.key !== 'End'
        ) {
          return;
        }
        const items = menu.content.current?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"]:not(:disabled)',
        );
        if (!items || items.length === 0) {
          return;
        }
        event.preventDefault();
        const current = Array.prototype.indexOf.call(items, document.activeElement) as number;
        let next = 0;
        if (event.key === 'End') {
          next = items.length - 1;
        } else if (event.key === 'ArrowDown') {
          next = (current + 1) % items.length;
        } else if (event.key === 'ArrowUp') {
          next = current <= 0 ? items.length - 1 : current - 1;
        }
        items[next].focus();
      }}
    />
  );
}

export function DropdownMenuItem({
  className,
  onClick,
  disabled,
  ...props
}: JSX.IntrinsicElements['button']) {
  const menu = useMenu();
  return (
    <button
      {...props}
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      className={[styles.item, className].filter(Boolean).join(' ')}
      onClick={(event) => {
        if (disabled || event.defaultPrevented) {
          return;
        }
        const previousFocus = document.activeElement;
        onClick?.(event);
        if (!event.defaultPrevented) {
          if (document.activeElement === previousFocus) {
            menu.trigger.current?.focus();
          }
          menu.setOpen(false);
        }
      }}
    />
  );
}
