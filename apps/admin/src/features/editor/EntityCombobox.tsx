import { useEffect, useState } from 'react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/lib/api';
import type { EntityOption } from '@/lib/api';
import { cn } from '@/lib/utils';

interface EntityComboboxProps {
  id?: string;
  value: string;
  /** Home Assistant domain, or domains, the search is restricted to. */
  domain: string | readonly string[];
  onChange: (entityId: string) => void;
  /** Adds a "No entity" row, for optional sources. */
  clearable?: boolean;
}

const searchDelayMs = 250;

function describeState(option: EntityOption): string {
  if (!option.available) {
    return m.admin_entity_unavailable();
  }

  return option.unit ? `${option.state} ${option.unit}` : option.state;
}

export function EntityCombobox({ id, value, domain, onChange, clearable }: EntityComboboxProps) {
  const domainLabel = typeof domain === 'string' ? domain : domain.join(m.admin_inspector_or());
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resolved, setResolved] = useState<{ entityId: string; option: EntityOption | null }>();

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(
      async () => {
        setLoading(true);

        try {
          const result = await api.getEntities(query, domain);

          if (active) {
            setOptions(result.entities);
            setError('');
          }
        } catch (error) {
          if (active) {
            setError(error instanceof Error ? error.message : m.admin_entity_search_failed());
          }
        }

        if (active) {
          setLoading(false);
        }
      },
      query ? searchDelayMs : 0,
    );

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [domain, open, query]);

  // Looks the current value up once, so the field can show its friendly name and state.
  useEffect(() => {
    if (!value) {
      return;
    }

    let active = true;

    api
      .getEntities(value, domain)
      .then((result) => {
        if (active) {
          const option = result.entities.find((item) => item.entityId === value) ?? null;

          setResolved({ entityId: value, option });
        }
      })
      .catch(() => {
        if (active) {
          setResolved(undefined);
        }
      });

    return () => {
      active = false;
    };
  }, [domain, value]);

  const known = resolved?.entityId === value ? resolved : undefined;
  let caption = '';

  if (known?.option) {
    caption = m.admin_entity_now_state({ state: describeState(known.option) });
  } else if (known) {
    caption = m.admin_entity_not_found_ha();
  }

  return (
    <div className="space-y-1.5">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setQuery('');
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-haspopup="listbox"
            aria-expanded={open}
            title={value || undefined}
            className="h-auto min-h-9 w-full justify-between py-1.5 text-left font-normal whitespace-normal"
          >
            {/* Full name and ID, wrapped rather than cut off, so similar entities stay distinguishable. */}
            {value ? (
              <span className="min-w-0 flex-1">
                {known?.option && <span className="block break-words">{known.option.name}</span>}
                <span
                  className={cn(
                    'block font-mono break-all',
                    known?.option && 'text-muted-foreground text-xs',
                  )}
                >
                  {value}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground min-w-0 flex-1 truncate">
                {m.admin_entity_search_entities({ domain: domainLabel })}
              </span>
            )}
            <ChevronsUpDownIcon className="text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>
        {/* Wider than the inspector field and opening toward the canvas, so long names fit. */}
        <PopoverContent
          align="end"
          className="w-[min(30rem,calc(100vw-2rem))] min-w-(--radix-popover-trigger-width) p-0"
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={m.admin_entity_search_placeholder({ domain: domainLabel })}
            />
            <CommandList>
              <CommandEmpty>
                {error || (loading ? m.admin_entity_searching() : m.admin_entity_no_matches())}
              </CommandEmpty>
              <CommandGroup>
                {clearable && value && (
                  <CommandItem
                    value="__none__"
                    onSelect={() => {
                      onChange('');
                      setOpen(false);
                    }}
                  >
                    <span className="text-muted-foreground">{m.admin_entity_none()}</span>
                  </CommandItem>
                )}
                {options.map((option) => (
                  <CommandItem
                    key={option.entityId}
                    value={option.entityId}
                    onSelect={() => {
                      onChange(option.entityId);
                      setOpen(false);
                    }}
                    className={cn('items-start gap-2', !option.available && 'opacity-60')}
                  >
                    <CheckIcon
                      className={cn(
                        'mt-0.5 shrink-0',
                        option.entityId === value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words">{option.name}</span>
                      <span className="text-muted-foreground block font-mono text-xs break-all">
                        {option.entityId}
                      </span>
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {describeState(option)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {caption && <p className="text-muted-foreground text-xs">{caption}</p>}
      {error && !open && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
