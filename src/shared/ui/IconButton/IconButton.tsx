import type { ComponentChildren } from 'preact';
import styles from './IconButton.module.css';

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: ComponentChildren;
  className?: string;
}

export function IconButton({ label, onClick, children, className = '' }: IconButtonProps) {
  return (
    <button
      type="button"
      class={`${styles.roundButton} ${className}`}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
