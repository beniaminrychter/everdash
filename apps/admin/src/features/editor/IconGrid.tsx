import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { SearchIcon } from 'lucide-react';
import { iconNames } from '@everdash/contracts/iconNames';
import type { IconName } from '@everdash/contracts/iconNames';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { IconGlyph } from './IconGlyph';
import { iconGroups } from './iconGroups';
import type { IconGroup } from './iconGroups';

const buttonBase =
  'focus-visible:ring-ring/50 rounded-md border text-sm transition-colors outline-none focus-visible:ring-[3px]';
const buttonOn = 'border-primary bg-primary/10 text-foreground ring-primary ring-1';
const buttonOff = 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground';

const listed = new Set<IconName>(iconGroups.flatMap((group) => group.icons));
const unlisted = iconNames.filter((name) => !listed.has(name));
const allGroups: readonly IconGroup[] = unlisted.length
  ? [...iconGroups, { label: 'More', icons: unlisted }]
  : iconGroups;

function visibleGroups(query: string): IconGroup[] {
  const needle = query.trim().toLowerCase().replace(/-/g, ' ');
  if (!needle) {
    return [...allGroups];
  }

  return allGroups
    .map((group) => {
      const groupMatches = group.label.toLowerCase().includes(needle);
      const icons = group.icons.filter(
        (name) => groupMatches || name.replace(/-/g, ' ').includes(needle),
      );

      return { label: group.label, icons };
    })
    .filter((group) => group.icons.length > 0);
}

interface IconGridProps {
  value: IconName | undefined;
  label: string;
  onChange: (icon: IconName | undefined) => void;
  /** Adds an "Auto" choice that clears the icon, so the tablet picks one from the device class. */
  auto?: boolean;
}

export function IconGrid({ value, label, onChange, auto = false }: IconGridProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState<IconName | undefined>();
  const list = useRef<HTMLDivElement>(null);
  const groups = visibleGroups(query);
  const shown = groups.flatMap((group) => group.icons);
  // One icon is a tab stop (the focused one, else the chosen one, else the first); arrows move.
  const stop =
    [focused, value].find((name) => name !== undefined && shown.includes(name)) ?? shown[0];

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    const current = document.activeElement;
    if (!keys.includes(event.key) || !(current instanceof HTMLButtonElement)) {
      return;
    }

    const buttons = Array.from(
      list.current?.querySelectorAll<HTMLButtonElement>('button[data-icon]') ?? [],
    );
    const index = buttons.indexOf(current);
    if (index === -1) {
      return;
    }

    event.preventDefault();
    let target: HTMLButtonElement | undefined;

    if (event.key === 'ArrowLeft') {
      target = buttons[index - 1];
    } else if (event.key === 'ArrowRight') {
      target = buttons[index + 1];
    } else if (event.key === 'Home') {
      target = buttons[0];
    } else if (event.key === 'End') {
      target = buttons[buttons.length - 1];
    } else {
      // Up and Down pick the nearest button in the adjacent row, across group boundaries.
      const from = current.getBoundingClientRect();
      const down = event.key === 'ArrowDown';
      let best = Infinity;

      for (const button of buttons) {
        const box = button.getBoundingClientRect();
        const rows = down ? box.top - from.top : from.top - box.top;
        if (rows < from.height / 2) {
          continue;
        }

        const distance = rows * 1000 + Math.abs(box.left - from.left);
        if (distance < best) {
          best = distance;
          target = button;
        }
      }
    }

    target?.focus();
    target?.scrollIntoView({ block: 'nearest' });
  }

  return (
    <fieldset className="grid gap-2">
      <legend className="sr-only">{label}</legend>
      {auto && (
        <button
          type="button"
          aria-pressed={value === undefined}
          onClick={() => onChange(undefined)}
          className={cn(buttonBase, 'h-9', value === undefined ? buttonOn : buttonOff)}
        >
          Auto (from the entity type)
        </button>
      )}
      <div className="relative">
        <SearchIcon
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label={`Search ${label.toLowerCase()}s`}
          placeholder="Search icons"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-8"
        />
      </div>
      <div
        ref={list}
        role="presentation"
        onKeyDown={move}
        className="grid max-h-72 gap-3 overflow-y-auto overscroll-contain pr-1"
      >
        {groups.map((group) => (
          <fieldset key={group.label} className="grid gap-1.5">
            <legend className="text-muted-foreground mb-1.5 text-xs font-medium">
              {group.label}
            </legend>
            <div className="grid grid-cols-6 gap-1.5">
              {group.icons.map((name) => {
                const pressed = value === name;

                return (
                  <button
                    key={name}
                    type="button"
                    data-icon=""
                    title={name}
                    aria-label={name}
                    aria-pressed={pressed}
                    tabIndex={name === stop ? 0 : -1}
                    onFocus={() => setFocused(name)}
                    onClick={() => onChange(name)}
                    className={cn(
                      buttonBase,
                      'grid h-9 place-items-center',
                      pressed ? buttonOn : buttonOff,
                    )}
                  >
                    <IconGlyph name={name} className="size-4" />
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        {groups.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No icons match “{query}”.
          </p>
        )}
      </div>
    </fieldset>
  );
}
