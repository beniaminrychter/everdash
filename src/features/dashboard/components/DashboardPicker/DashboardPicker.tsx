import { useEffect, useRef, useState } from 'preact/hooks';
import { useI18n } from '../../../../shared/i18n/index';
import styles from './DashboardPicker.module.css';

interface Props {
  pages: readonly { id: string; title: string }[];
  selected: string;
  onSelect: (id: string) => void;
}
export function DashboardPicker({ pages, selected, onSelect }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) {
      return;
    }
    options.current?.querySelector('button')?.focus();
    const outside = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('touchstart', outside);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('touchstart', outside);
    };
  }, [open]);
  const keyboard = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    if (!open) {
      setOpen(true);
      return;
    }
    const buttons = [...(options.current?.querySelectorAll('button') || [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  };
  const blur = (event: FocusEvent) => {
    if (!root.current?.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };
  return (
    <nav aria-label={t('Dashboard selection')} class={styles.picker} ref={root}>
      <h1>
        <button
          ref={trigger}
          type="button"
          class={styles.trigger}
          aria-label={t('{name}, choose dashboard', {
            name: pages.find((page) => page.id === selected)?.title || '',
          })}
          aria-expanded={open}
          aria-controls={open ? 'dashboard-options' : undefined}
          onClick={() => setOpen(!open)}
          onKeyDown={keyboard}
          onBlur={blur}
        >
          {pages.find((page) => page.id === selected)?.title}
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
            <path
              d="m5 8 5 5 5-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </h1>
      {open && (
        <div
          id="dashboard-options"
          ref={options}
          class={styles.options}
          aria-label={t('Dashboards')}
        >
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              aria-pressed={page.id === selected}
              onKeyDown={keyboard}
              onBlur={blur}
              onClick={() => {
                onSelect(page.id);
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              {page.title}
              <span aria-hidden="true">{page.id === selected ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
