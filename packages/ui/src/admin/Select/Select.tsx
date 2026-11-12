import { useFieldControlId } from '../Field/Field';
import styles from './Select.module.css';

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
  const id = useFieldControlId();

  return (
    <select
      aria-label={ariaLabel}
      className={[styles.select, className].filter(Boolean).join(' ')}
      id={id}
      onChange={(event) => onValueChange(event.currentTarget.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
