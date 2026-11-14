import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from 'lucide-react';
import type { CardConfig, ValueTemplate } from '@everdash/contracts/config/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDraft } from '@/app/DraftContext';
import { cardKindInfo, isEntityForDomain } from './cardKinds';
import type { DeleteTarget } from './DeleteItemDialog';
import { EntityCombobox } from './EntityCombobox';
import { IconGrid } from './IconGrid';
import { InspectorField, InspectorPanel } from './InspectorPanel';

export type CardSelection =
  | { kind: 'card'; index: number }
  | { kind: 'pending-card'; card: CardConfig };

interface CardInspectorProps {
  selection: CardSelection;
  onRequestDelete: (target: DeleteTarget) => void;
}

const valueTemplates: readonly { value: ValueTemplate; label: string }[] = [
  { value: 'tile', label: 'Tile' },
  { value: 'compact', label: 'Compact' },
  { value: 'hero', label: 'Hero' },
];

const precisionOptions = ['auto', '0', '1', '2', '3'] as const;

const pstrykSources = [
  ['sellPrice', 'Sell price sensor'],
  ['nextPrice', 'Next price sensor'],
  ['usage', 'Usage sensor'],
  ['schedule', 'Schedule sensor'],
] as const;

function patch(card: CardConfig, changes: Record<string, unknown>): CardConfig {
  return { ...card, ...changes } as CardConfig;
}

export function CardInspector({ selection, onRequestDelete }: CardInspectorProps) {
  const { state, dispatch } = useDraft();
  const view = state.document.views.find((item) => item.id === state.viewId);
  const cardCount = view?.cards?.length ?? 0;
  const card = selection.kind === 'pending-card' ? selection.card : view?.cards?.[selection.index];

  if (!card) {
    return null;
  }

  const info = cardKindInfo(card.type);
  const pending = selection.kind === 'pending-card';
  const entityInvalid = card.entity.length > 0 && !isEntityForDomain(card.entity, info.domains);
  const canAdd = isEntityForDomain(card.entity, info.domains);

  function change(next: CardConfig) {
    if (selection.kind === 'pending-card') {
      dispatch({ type: 'update-pending', value: next });

      return;
    }

    dispatch({ type: 'update-card', index: selection.index, card: next });
  }

  const footer =
    selection.kind === 'pending-card' ? (
      <>
        <Button disabled={!canAdd} onClick={() => dispatch({ type: 'commit-pending' })}>
          Add card
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: 'select', selection: { kind: 'view' } })}
        >
          Cancel
        </Button>
      </>
    ) : (
      <>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Move card up"
          disabled={selection.index === 0}
          onClick={() => dispatch({ type: 'move-card', index: selection.index, offset: -1 })}
        >
          <ArrowUpIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Move card down"
          disabled={selection.index >= cardCount - 1}
          onClick={() => dispatch({ type: 'move-card', index: selection.index, offset: 1 })}
        >
          <ArrowDownIcon />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive ml-auto"
          onClick={() => onRequestDelete({ kind: 'card', index: selection.index })}
        >
          <Trash2Icon />
          Delete card
        </Button>
      </>
    );

  return (
    <InspectorPanel
      eyebrow={pending ? `New ${info.label.toLowerCase()} card` : `${info.label} card`}
      title={card.name || card.entity || 'Choose an entity'}
      footer={footer}
    >
      <InspectorField
        label="Home Assistant entity"
        htmlFor="card-entity"
        error={entityInvalid ? `Choose a ${info.domains.join(' or ')} entity.` : undefined}
      >
        <EntityCombobox
          id="card-entity"
          value={card.entity}
          domain={info.domains}
          onChange={(entity) => change(patch(card, { entity }))}
        />
      </InspectorField>
      <InspectorField label="Display name" htmlFor="card-name">
        <Input
          id="card-name"
          placeholder="Use Home Assistant name"
          value={card.name ?? ''}
          onChange={(event) => change(patch(card, { name: event.target.value || undefined }))}
        />
      </InspectorField>
      {(card.type === 'light' ||
        card.type === 'outlet' ||
        card.type === 'value' ||
        card.type === 'toggle' ||
        card.type === 'scene') && (
        <InspectorField label="Icon">
          <IconGrid
            label="Card icon"
            value={card.icon}
            onChange={(icon) => change(patch(card, { icon }))}
          />
        </InspectorField>
      )}
      {card.type === 'value' && (
        <>
          <InspectorField label="Template">
            <fieldset className="grid grid-cols-3 gap-1.5">
              <legend className="sr-only">Template</legend>
              {valueTemplates.map(({ value, label }) => {
                const selected = (card.template ?? 'tile') === value;

                return (
                  <Button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    variant={selected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      change(patch(card, { template: value === 'tile' ? undefined : value }))
                    }
                  >
                    {label}
                  </Button>
                );
              })}
            </fieldset>
          </InspectorField>
          <InspectorField label="Unit" htmlFor="card-value-unit">
            <Input
              id="card-value-unit"
              placeholder="Use Home Assistant unit"
              maxLength={12}
              value={card.unit ?? ''}
              onChange={(event) => change(patch(card, { unit: event.target.value || undefined }))}
            />
          </InspectorField>
          <InspectorField label="Decimal places" htmlFor="card-value-precision">
            <Select
              value={card.precision === undefined ? 'auto' : String(card.precision)}
              onValueChange={(value) =>
                change(patch(card, { precision: value === 'auto' ? undefined : Number(value) }))
              }
            >
              <SelectTrigger id="card-value-precision" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {precisionOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'auto' ? 'Auto' : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InspectorField>
        </>
      )}
      {card.type === 'climate' && (
        <InspectorField label="Temperature unit" htmlFor="card-unit">
          <Select
            value={card.temperatureUnit ?? 'ha-default'}
            onValueChange={(value) =>
              change(patch(card, { temperatureUnit: value === 'ha-default' ? undefined : value }))
            }
          >
            <SelectTrigger id="card-unit" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ha-default">Use Home Assistant unit</SelectItem>
              <SelectItem value="°C">°C Celsius</SelectItem>
              <SelectItem value="°F">°F Fahrenheit</SelectItem>
            </SelectContent>
          </Select>
        </InspectorField>
      )}
      {card.type === 'pstryk' && (
        <div className="space-y-4 border-t pt-4">
          <p className="text-muted-foreground text-xs">Optional Pstryk sources</p>
          {pstrykSources.map(([field, label]) => (
            <InspectorField key={field} label={label} htmlFor={`card-${field}`}>
              <EntityCombobox
                id={`card-${field}`}
                value={card[field] ?? ''}
                domain="sensor"
                clearable
                onChange={(entity) => change(patch(card, { [field]: entity || undefined }))}
              />
            </InspectorField>
          ))}
        </div>
      )}
    </InspectorPanel>
  );
}
