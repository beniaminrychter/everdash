import type { JSX } from 'preact';
import styles from './Badge.module.css';

export function Badge({ className, ...props }: JSX.IntrinsicElements['span']) {
  return <span className={[styles.badge, className].filter(Boolean).join(' ')} {...props} />;
}
