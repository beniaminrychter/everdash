import { useCallback, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { EditorIcon } from '../EditorIcon/EditorIcon';
import styles from './EditorMenu.module.css';

export interface MenuChoice {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** The choice that is already in effect; it is marked and cannot be picked again. */
  current?: boolean;
}

export interface MenuItem extends Omit<MenuChoice, 'current'> {
  danger?: boolean;
  /** Choices listed under the item when it is opened (Move to section). */
  choices?: readonly MenuChoice[];
}

interface Props {
  /** Names the trigger button, e.g. "More actions for Lounge". */
  label: string;
  items: readonly MenuItem[];
  /** Called as the menu opens or closes, so the card around it can rise above its neighbours. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * The ⋮ menu of a card or section. It opens inside the card (not in a layer above the page), so
 * the card's own position places it; it closes on Escape, Tab and a press anywhere outside, moves
 * focus into itself and hands it back to the button.
 */
export function EditorMenu({ label, items, onOpenChange }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);

  const close = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      setExpanded(null);
      onOpenChange?.(false);

      if (restoreFocus) {
        button.current?.focus();
      }
    },
    [onOpenChange],
  );

  const toggle = () => {
    if (open) {
      close(false);

      return;
    }

    setOpen(true);
    onOpenChange?.(true);
  };

  const enabledItems = () =>
    Array.prototype.slice.call(
      popup.current?.querySelectorAll<HTMLButtonElement>(
        'button[role^="menuitem"]:not(:disabled)',
      ) ?? [],
    ) as HTMLButtonElement[];

  // Focus moves into the menu as it opens, before anything else can be pressed.
  useLayoutEffect(() => {
    if (open) {
      enabledItems()[0]?.focus();
    }
  }, [open]);

  // A press outside the menu closes it.
  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }

    const outside = (event: Event) => {
      if (!root.current?.contains(event.target as Node)) {
        close(false);
      }
    };

    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('mousedown', outside, true);

    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('mousedown', outside, true);
    };
  }, [open, close]);

  const onKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);

      return;
    }

    if (event.key === 'Tab') {
      close(false);

      return;
    }

    const available = enabledItems();
    const current = available.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;

    if (event.key === 'ArrowDown') {
      next = (current + 1) % available.length;
    } else if (event.key === 'ArrowUp') {
      next = (current - 1 + available.length) % available.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = available.length - 1;
    }

    if (next >= 0) {
      event.preventDefault();
      available[next]?.focus();
    }
  };

  const choose = (action: () => void) => {
    close(true);
    action();
  };

  return (
    <div
      class={styles.menu}
      ref={root}
      role="presentation"
      data-editor-nodrag=""
      onKeyDown={open ? onKeyDown : undefined}
    >
      <button
        ref={button}
        type="button"
        class={styles.trigger}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            toggle();
          }
        }}
      >
        <EditorIcon name="more" />
      </button>
      {open && (
        <div ref={popup} class={styles.popup} role="menu" tabIndex={-1} aria-label={label}>
          {items.map((item) => (
            <div key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                class={item.danger ? `${styles.item} ${styles.danger}` : styles.item}
                disabled={item.disabled}
                aria-haspopup={item.choices ? 'menu' : undefined}
                aria-expanded={item.choices ? expanded === item.label : undefined}
                onClick={() => {
                  if (item.choices) {
                    setExpanded(expanded === item.label ? null : item.label);

                    return;
                  }

                  choose(item.onSelect);
                }}
              >
                {item.label}
                {item.choices && <span class={styles.chevron} aria-hidden="true" />}
              </button>
              {item.choices && expanded === item.label && (
                <fieldset class={styles.choices} aria-label={item.label}>
                  {item.choices.map((choice) => (
                    <button
                      key={choice.label}
                      type="button"
                      role="menuitem"
                      class={styles.item}
                      disabled={choice.disabled || choice.current}
                      aria-current={choice.current ? 'true' : undefined}
                      onClick={() => choose(choice.onSelect)}
                    >
                      {choice.label}
                      {choice.current && (
                        <span class={styles.check}>
                          <EditorIcon name="check" />
                        </span>
                      )}
                    </button>
                  ))}
                </fieldset>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
