import { createContext } from 'preact';
import type { JSX } from 'preact';
import { useCallback, useContext, useId, useMemo, useState } from 'preact/hooks';
import styles from './Collapsible.module.css';

interface CollapsibleContextValue {
  open: boolean;
  toggle: () => void;
  id: string;
}

const CollapsibleContext = createContext<CollapsibleContextValue | undefined>(undefined);

function useCollapsible() {
  const context = useContext(CollapsibleContext);

  if (!context) {
    throw new Error('Collapsible components must be used within Collapsible');
  }

  return context;
}

type CollapsibleProps = JSX.IntrinsicElements['div'] & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const id = useId();
  const isOpen = open === undefined ? internalOpen : open;

  const toggle = useCallback(() => {
    if (open === undefined) {
      setInternalOpen(!isOpen);
    }
    onOpenChange?.(!isOpen);
  }, [open, isOpen, onOpenChange]);
  const context = useMemo(() => ({ open: isOpen, toggle, id }), [isOpen, toggle, id]);

  return (
    <CollapsibleContext.Provider value={context}>
      <div {...props}>{children}</div>
    </CollapsibleContext.Provider>
  );
}

export function CollapsibleTrigger({
  className,
  onClick,
  disabled,
  ...props
}: JSX.IntrinsicElements['button']) {
  const collapsible = useCollapsible();

  return (
    <button
      {...props}
      aria-controls={collapsible.id}
      aria-expanded={collapsible.open}
      className={[styles.trigger, className].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) {
          collapsible.toggle();
        }
      }}
      type="button"
    />
  );
}

export function CollapsibleContent({ className, ...props }: JSX.IntrinsicElements['div']) {
  const collapsible = useCollapsible();

  return (
    <div
      {...props}
      className={[styles.content, className].filter(Boolean).join(' ')}
      hidden={!collapsible.open}
      id={collapsible.id}
    />
  );
}
