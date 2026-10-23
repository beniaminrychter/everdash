import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

export function Select({
  value,
  onValueChange,
  options,
  className,
  ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  ariaLabel: string;
}) {
  return (
    <SelectPrimitive.Root
      items={options}
      value={value}
      onValueChange={(next) => onValueChange(next ?? '')}
    >
      <SelectPrimitive.Trigger className={className} aria-label={ariaLabel}>
        <span className="select-value">
          {options.find((option) => option.value === value)?.label ?? ''}
        </span>
        <SelectPrimitive.Icon>
          <ChevronDown size={16} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner className="select-positioner" sideOffset={5}>
          <SelectPrimitive.Popup className="select-popup">
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="select-item"
                >
                  <SelectPrimitive.ItemIndicator className="select-indicator">
                    <Check size={15} />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
