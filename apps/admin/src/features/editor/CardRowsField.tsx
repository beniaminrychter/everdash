import { cardRows } from '@everdash/contracts/config/cardRows';
import type { CardRows } from '@everdash/contracts/config/cardRows';
import { Button } from '@/components/ui/button';
import { InspectorField } from './InspectorPanel';

const rowLabels: Record<CardRows, string> = { 1: '1 row', 2: '2 rows' };

interface CardRowsFieldProps {
  /** The rows in effect, including the default of a card whose configuration leaves it unset. */
  value: CardRows;
  onChange: (rows: CardRows) => void;
}

/** How tall a widget card is: one row of accessory tiles or two. */
export function CardRowsField({ value, onChange }: CardRowsFieldProps) {
  return (
    <InspectorField label="Rows" hint="How many rows of tiles the card is tall.">
      <fieldset className="grid grid-cols-2 gap-1.5">
        <legend className="sr-only">Rows</legend>
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
