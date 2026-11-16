import { cardSizes } from '@everdash/contracts/config/cardSize';
import type { CardSize } from '@everdash/contracts/config/cardSize';
import { Button } from '@/components/ui/button';
import { InspectorField } from './InspectorPanel';

const sizeLabels: Record<CardSize, string> = { third: '1/3', half: '1/2', full: '1/1' };

interface CardSizeFieldProps {
  /** The size in effect, including the default of a card whose configuration leaves it unset. */
  value: CardSize;
  onChange: (size: CardSize) => void;
}

/** How much of the row a widget card takes, for any widget card that supports a size. */
export function CardSizeField({ value, onChange }: CardSizeFieldProps) {
  return (
    <InspectorField label="Size" hint="Share of the row the card takes.">
      <fieldset className="grid grid-cols-3 gap-1.5">
        <legend className="sr-only">Size</legend>
        {cardSizes.map((size) => {
          const selected = value === size;

          return (
            <Button
              key={size}
              type="button"
              aria-pressed={selected}
              variant={selected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(size)}
            >
              {sizeLabels[size]}
            </Button>
          );
        })}
      </fieldset>
    </InspectorField>
  );
}
