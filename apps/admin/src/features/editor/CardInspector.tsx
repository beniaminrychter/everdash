import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from 'lucide-react';
import { hasCardEntity } from '@everdash/contracts/config/cardDomains';
import { defaultCardRows } from '@everdash/contracts/config/cardRows';
import type { CardRows } from '@everdash/contracts/config/cardRows';
import { defaultCardSize } from '@everdash/contracts/config/cardSize';
import type { CardSize } from '@everdash/contracts/config/cardSize';
import type { CardConfig, ClockDisplay, ValueTemplate } from '@everdash/contracts/config/types';
import { defaultForecastType } from '@everdash/contracts/config/weatherForecast';
import type { ForecastType } from '@everdash/contracts/config/weatherForecast';
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
import { compatibleCardKinds, convertCard } from '@/app/draft/builder';
import { isIncomplete } from '@/app/draft/incomplete';
import type { CardKind } from '@/app/draft/builder';
import { cardKindInfo, cardKinds, isEntityForDomain } from './cardKinds';
import type { DeleteTarget } from './DeleteItemDialog';
import { CardRowsField } from './CardRowsField';
import { CardSizeField } from './CardSizeField';
import { EntityCombobox } from './EntityCombobox';
import { IconGrid } from './IconGrid';
import { InspectorField, InspectorPanel } from './InspectorPanel';

export interface CardSelection {
  kind: 'card';
  section?: string;
  index: number;
}

interface CardInspectorProps {
  selection: CardSelection;
  onRequestDelete: (target: DeleteTarget) => void;
}

const valueTemplates: readonly { value: ValueTemplate; label: string }[] = [
  { value: 'tile', label: 'Tile' },
  { value: 'compact', label: 'Compact' },
  { value: 'hero', label: 'Hero' },
];

const forecastOptions: readonly { value: ForecastType; label: string }[] = [
  { value: 'hourly', label: 'Every hour' },
  { value: 'daily', label: 'Every day' },
];

const clockDisplays: readonly { value: ClockDisplay; label: string }[] = [
  { value: 'time', label: 'Time' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Both' },
];

/** Select values: section ids are prefixed so none can equal the value for the unsectioned cards. */
const noSection = 'none';
const sectionPrefix = 'section:';

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
  const section = selection.section ?? null;
  const sections = view?.sections ?? [];
  const list = section === null ? view?.cards : sections.find((item) => item.id === section)?.cards;
  const cardCount = list?.length ?? 0;
  const card = list?.[selection.index];

  if (!card) {
    return null;
  }

  const info = cardKindInfo(card.type);
  // A card that was just added is finished (or cancelled) here before it can be saved.
  const pending = isIncomplete(card);
  // A card without an entity, such as the clock, has nothing to pick or validate.
  const entity = hasCardEntity(card) ? card.entity : undefined;
  const entityInvalid =
    entity !== undefined && entity.length > 0 && !isEntityForDomain(entity, info.domains);
  const canAdd = entity === undefined || isEntityForDomain(entity, info.domains);
  const allKinds = cardKinds.map((item) => item.kind);
  // A saved card may only switch to types that accept its entity, so the draft stays valid.
  const typeChoices = pending
    ? allKinds
    : entity === undefined
      ? [card.type]
      : compatibleCardKinds(entity, allKinds);

  function change(next: CardConfig) {
    dispatch({ type: 'update-card', section, index: selection.index, card: next });
  }

  const setSize = (size: CardSize) =>
    change(patch(card, { size: size === defaultCardSize(card.type) ? undefined : size }));

  const setRows = (rows: CardRows) =>
    change(patch(card, { rows: rows === defaultCardRows ? undefined : rows }));

  const footer = pending ? (
    <>
      <Button
        disabled={!canAdd}
        onClick={() => dispatch({ type: 'finish-card', section, index: selection.index })}
      >
        Add card
      </Button>
      <Button
        variant="ghost"
        onClick={() => dispatch({ type: 'delete-card', section, index: selection.index })}
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
        onClick={() => dispatch({ type: 'move-card', section, index: selection.index, offset: -1 })}
      >
        <ArrowUpIcon />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Move card down"
        disabled={selection.index >= cardCount - 1}
        onClick={() => dispatch({ type: 'move-card', section, index: selection.index, offset: 1 })}
      >
        <ArrowDownIcon />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive ml-auto"
        onClick={() => onRequestDelete({ kind: 'card', section, index: selection.index })}
      >
        <Trash2Icon />
        Delete card
      </Button>
    </>
  );

  return (
    <InspectorPanel
      eyebrow={pending ? `New ${info.label.toLowerCase()} card` : `${info.label} card`}
      title={card.name || entity || (entity === undefined ? info.label : 'Choose an entity')}
      footer={footer}
    >
      <InspectorField
        label="Card type"
        htmlFor="card-type"
        hint={
          pending || entity === undefined
            ? undefined
            : typeChoices.length > 1
              ? 'Only types that can show this entity are listed.'
              : 'No other card type can show this entity.'
        }
      >
        <Select
          value={card.type}
          disabled={typeChoices.length < 2}
          onValueChange={(kind) => change(convertCard(card, kind as CardKind))}
        >
          <SelectTrigger id="card-type" className="w-full">
            {/* The closed select shows the icon and name only; the list adds descriptions. */}
            <SelectValue>
              <info.icon aria-hidden="true" />
              {info.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {typeChoices.map((kind) => {
              const { label, description, icon: Icon } = cardKindInfo(kind);

              return (
                <SelectItem key={kind} value={kind} textValue={label}>
                  <Icon aria-hidden="true" />
                  <span className="flex flex-col">
                    <span>{label}</span>
                    <span className="text-muted-foreground text-xs">{description}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </InspectorField>
      {sections.length > 0 && (
        <InspectorField label="Section" htmlFor="card-section">
          <Select
            value={section === null ? noSection : `${sectionPrefix}${section}`}
            onValueChange={(value) => {
              const target = value === noSection ? null : value.slice(sectionPrefix.length);

              dispatch({ type: 'send-card', section, index: selection.index, toSection: target });
            }}
          >
            <SelectTrigger id="card-section" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noSection}>No section (top of the view)</SelectItem>
              {sections.map((item) => (
                <SelectItem key={item.id} value={`${sectionPrefix}${item.id}`}>
                  {item.title || 'Untitled section'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InspectorField>
      )}
      {entity !== undefined && (
        <InspectorField
          label="Home Assistant entity"
          htmlFor="card-entity"
          error={entityInvalid ? `Choose a ${info.domains.join(' or ')} entity.` : undefined}
        >
          <EntityCombobox
            id="card-entity"
            value={entity}
            domain={info.domains}
            onChange={(next) => change(patch(card, { entity: next }))}
          />
        </InspectorField>
      )}
      <InspectorField label="Display name" htmlFor="card-name">
        <Input
          id="card-name"
          placeholder={card.type === 'clock' ? 'No heading' : 'Use Home Assistant name'}
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
            auto={card.type === 'value' || card.type === 'toggle'}
            onChange={(icon) => change(patch(card, { icon }))}
          />
        </InspectorField>
      )}
      {card.type === 'clock' && (
        <InspectorField label="Show">
          <fieldset className="grid grid-cols-3 gap-1.5">
            <legend className="sr-only">Show</legend>
            {clockDisplays.map(({ value, label }) => {
              const selected = (card.display ?? 'datetime') === value;

              return (
                <Button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    change(patch(card, { display: value === 'datetime' ? undefined : value }))
                  }
                >
                  {label}
                </Button>
              );
            })}
          </fieldset>
        </InspectorField>
      )}
      {card.type === 'weather' && (
        <InspectorField label="Forecast" hint="One entry per hour, or one per day.">
          <fieldset className="grid grid-cols-2 gap-1.5">
            <legend className="sr-only">Forecast</legend>
            {forecastOptions.map(({ value, label }) => {
              const selected = (card.forecast ?? defaultForecastType) === value;

              return (
                <Button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    change(
                      patch(card, { forecast: value === defaultForecastType ? undefined : value }),
                    )
                  }
                >
                  {label}
                </Button>
              );
            })}
          </fieldset>
        </InspectorField>
      )}
      {(card.type === 'clock' || card.type === 'weather') && (
        <CardSizeField value={card.size ?? defaultCardSize(card.type)} onChange={setSize} />
      )}
      {card.type === 'weather' && (
        <CardRowsField value={card.rows ?? defaultCardRows} onChange={setRows} />
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
              disabled={card.unit === ''}
              value={card.unit ?? ''}
              onChange={(event) => change(patch(card, { unit: event.target.value || undefined }))}
            />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={card.unit === ''}
                onChange={(event) =>
                  change(patch(card, { unit: event.target.checked ? '' : undefined }))
                }
              />
              Hide unit
            </label>
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
