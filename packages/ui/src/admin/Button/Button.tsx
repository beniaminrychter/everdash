import type { JSX } from 'preact';
import styles from './Button.module.css';

const variants = {
  secondary: styles.secondary,
  outline: styles.outline,
  ghost: styles.ghost,
  destructive: styles.destructive,
};
const sizes = { sm: styles.sm, icon: styles.icon };

type ButtonProps = JSX.IntrinsicElements['button'] & {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'icon';
};

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        styles.button,
        variant === 'default' ? undefined : variants[variant],
        size === 'default' ? undefined : sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      // oxlint-disable-next-line react/button-has-type
      type={type}
      {...props}
    />
  );
}
