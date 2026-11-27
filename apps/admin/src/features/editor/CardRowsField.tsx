import { cardRows } from '@everdash/contracts/config/cardRows';
import type { CardRows } from '@everdash/contracts/config/cardRows';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { InspectorField } from './InspectorPanel';

interface CardRowsFieldProps {
  /** The rows in effect, including the default of a card whose configuration leaves it unset. */
  value: CardRows;
  onChange: (rows: CardRows) => void;
}

/** How tall a widget card is: one row of accessory tiles or two. */
export function CardRowsField({ value, onChange }: CardRowsFieldProps) {
  const rowLabels: Record<CardRows, string> = {
    1: m.admin_inspector_rows_one(),
    2: m.admin_inspector_rows_two(),
  };

  return (
    <InspectorField label={m.admin_inspector_rows()} hint={m.admin_inspector_rows_hint()}>
      <fieldset className="grid grid-cols-2 gap-1.5">
        <legend className="sr-only">{m.admin_inspector_rows()}</legend>
        {cardRows.map((rows) => {
          const selected = value === rows;

          return (
            <Button
              key={rows}
              type="button"
              aria-pressed={selected}
              variant={selected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(rows)}
            >
              {rowLabels[rows]}
            </Button>
          );
        })}
      </fieldset>
    </InspectorField>
  );
}
