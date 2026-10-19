import styles from './PowerToggle.module.css';

interface PowerToggleProps {
  on: boolean;
  label: string;
  onToggle: () => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function PowerToggle({
  on,
  label,
  onToggle,
  id,
  className = '',
  disabled = false,
}: PowerToggleProps) {
  return (
    <button
      type="button"
      id={id}
      class={`${styles.powerToggle} ${className}`}
      aria-label={label}
      aria-pressed={on}
      disabled={disabled}
      onClick={onToggle}
    >
      <span />
    </button>
  );
}
