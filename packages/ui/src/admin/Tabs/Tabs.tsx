import { createContext } from 'preact';
import type { JSX } from 'preact';
import { useCallback, useContext, useId, useMemo, useState } from 'preact/hooks';
import styles from './Tabs.module.css';

interface TabsContextValue {
  value: string | undefined;
  select: (value: string) => void;
  id: string;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }

  return context;
}

function tabId(id: string, value: string) {
  return `${id}-tab-${encodeURIComponent(value)}`;
}

function panelId(id: string, value: string) {
  return `${id}-panel-${encodeURIComponent(value)}`;
}

type TabsProps = Omit<JSX.IntrinsicElements['div'], 'onChange'> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export function Tabs({ value, defaultValue, onValueChange, children, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const id = useId();
  const selectedValue = value === undefined ? internalValue : value;

  const select = useCallback(
    (next: string) => {
      if (next !== selectedValue) {
        if (value === undefined) {
          setInternalValue(next);
        }
        onValueChange?.(next);
      }
    },
    [selectedValue, value, onValueChange],
  );
  const context = useMemo(
    () => ({ value: selectedValue, select, id }),
    [selectedValue, select, id],
  );

  return (
    <TabsContext.Provider value={context}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: JSX.IntrinsicElements['div']) {
  return (
    <div {...props} className={[styles.list, className].filter(Boolean).join(' ')} role="tablist" />
  );
}

type TriggerProps = Omit<JSX.IntrinsicElements['button'], 'value'> & { value: string };

export function TabsTrigger({
  value,
  className,
  onClick,
  onKeyDown,
  disabled,
  ...props
}: TriggerProps) {
  const tabs = useTabs();
  const selected = tabs.value === value;

  function handleKeyDown(event: JSX.TargetedKeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const list = event.currentTarget.closest('[role="tablist"]');
    if (!list) {
      return;
    }
    const triggers = Array.prototype.slice.call(
      list.querySelectorAll('[role="tab"]:not(:disabled)'),
    ) as HTMLButtonElement[];
    const current = triggers.indexOf(event.currentTarget);
    let next = current;

    if (event.key === 'ArrowRight') {
      next = (current + 1) % triggers.length;
    } else if (event.key === 'ArrowLeft') {
      next = (current - 1 + triggers.length) % triggers.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = triggers.length - 1;
    } else {
      return;
    }

    if (triggers[next]) {
      event.preventDefault();
      triggers[next].focus();
      triggers[next].click();
    }
  }

  return (
    <button
      {...props}
      aria-controls={panelId(tabs.id, value)}
      aria-selected={selected}
      className={[styles.trigger, className].filter(Boolean).join(' ')}
      disabled={disabled}
      id={tabId(tabs.id, value)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) {
          tabs.select(value);
        }
      }}
      onKeyDown={handleKeyDown}
      role="tab"
      tabIndex={selected ? 0 : -1}
      type="button"
    />
  );
}

type ContentProps = Omit<JSX.IntrinsicElements['div'], 'value'> & { value: string };

export function TabsContent({ value, className, ...props }: ContentProps) {
  const tabs = useTabs();

  return (
    <div
      {...props}
      aria-labelledby={props['aria-label'] ? undefined : tabId(tabs.id, value)}
      className={[styles.content, className].filter(Boolean).join(' ')}
      hidden={tabs.value !== value}
      id={panelId(tabs.id, value)}
      role="tabpanel"
    />
  );
}
