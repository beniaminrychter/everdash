import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import type { ReactNode } from 'react';

export function Combobox({
  value,
  inputValue,
  onValueChange,
  onInputValueChange,
  options,
  placeholder,
  empty,
}: {
  value: string;
  inputValue: string;
  onValueChange: (value: string) => void;
  onInputValueChange: (value: string) => void;
  options: { value: string; label: string; detail?: string; unavailable?: boolean }[];
  placeholder: string;
  empty: ReactNode;
}) {
  const selected = options.find((option) => option.value === value) ?? null;
  return (
    <ComboboxPrimitive.Root
      items={options}
      value={selected}
      inputValue={inputValue}
      onInputValueChange={onInputValueChange}
      onValueChange={(next) => onValueChange(next?.value ?? '')}
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.value}
      isItemEqualToValue={(item, selectedItem) => item.value === selectedItem.value}
      filter={(item, query) =>
        `${item.value} ${item.label}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      }
      autoHighlight
    >
      <ComboboxPrimitive.Input className="input" placeholder={placeholder} />
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner className="combobox-positioner">
          <ComboboxPrimitive.Popup className="combobox-popup">
            <ComboboxPrimitive.List className="combobox-list">
              {(item: { value: string; label: string; detail?: string; unavailable?: boolean }) => (
                <ComboboxPrimitive.Item className="combobox-option" key={item.value} value={item}>
                  <span>
                    <strong>{item.label}</strong>
                    <small>
                      {item.value}
                      {item.detail ? ` · ${item.detail}` : ''}
                    </small>
                  </span>
                  {item.unavailable && <em>Unavailable</em>}
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
            <ComboboxPrimitive.Empty className="combobox-empty">{empty}</ComboboxPrimitive.Empty>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}
