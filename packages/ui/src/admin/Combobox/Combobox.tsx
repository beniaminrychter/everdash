/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- The input owns keyboard focus for the listbox. */
import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { useFieldControlId } from '../Field/Field';
import styles from './Combobox.module.css';

interface Option {
  value: string;
  label: string;
  detail?: string;
  unavailable?: boolean;
}

export function Combobox({
  value,
  inputValue,
  onValueChange,
  onInputValueChange,
  options,
  placeholder,
  empty,
}: {
  value: string;
  inputValue: string;
  onValueChange: (value: string) => void;
  onInputValueChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  empty: ComponentChildren;
}) {
  const id = useFieldControlId();
  const popupId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const query = inputValue.toLocaleLowerCase();
  const filtered = options.filter((option) =>
    `${option.value} ${option.label}`.toLocaleLowerCase().includes(query),
  );
  const activeIndex = Math.min(active, filtered.length - 1);
  const optionId = (option: Option) => `${popupId}-option-${encodeURIComponent(option.value)}`;

  useEffect(() => {
    if (!open) {
      return;
    }

    const dismiss = (event: Event) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('touchstart', dismiss);
    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('touchstart', dismiss);
    };
  }, [open]);

  useEffect(() => {
    if (!(open && activeIndex >= 0 && listRef.current)) {
      return;
    }

    const list = listRef.current;
    const option = list.children[activeIndex] as HTMLElement | undefined;
    if (option) {
      if (option.offsetTop < list.scrollTop) {
        list.scrollTop = option.offsetTop;
      } else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
      }
    }
  }, [open, activeIndex, inputValue, options]);

  const select = (option: Option) => {
    onValueChange(option.value);
    inputRef.current?.focus();
    setOpen(false);
  };

  const onKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(event.key === 'ArrowDown' ? 0 : Math.max(filtered.length - 1, 0));
      } else if (filtered.length) {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        setActive((activeIndex + direction + filtered.length) % filtered.length);
      }
    } else if (event.key === 'Enter' && open && filtered[activeIndex]) {
      event.preventDefault();
      select(filtered[activeIndex]);
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <input
        aria-activedescendant={
          open && filtered[activeIndex] ? optionId(filtered[activeIndex]) : undefined
        }
        aria-autocomplete="list"
        aria-controls={open ? popupId : undefined}
        aria-expanded={open}
        className={styles.input}
        id={id}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onInput={(event) => {
          onInputValueChange(event.currentTarget.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        role="combobox"
        value={inputValue}
      />
      {open && (
        <div className={styles.popup}>
          <div className={styles.list} id={popupId} ref={listRef} role="listbox">
            {filtered.map((option, index) => (
              <div
                aria-selected={option.value === value}
                className={
                  index === activeIndex ? `${styles.option} ${styles.active}` : styles.option
                }
                id={optionId(option)}
                key={option.value}
                onClick={() => select(option)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
              >
                <span>
                  <strong>{option.label}</strong>
                  <small>
                    {option.value}
                    {option.detail ? ` · ${option.detail}` : ''}
                  </small>
                </span>
                {option.unavailable && <em>Unavailable</em>}
              </div>
            ))}
          </div>
          {filtered.length === 0 && <div className={styles.empty}>{empty}</div>}
        </div>
      )}
    </div>
  );
}
