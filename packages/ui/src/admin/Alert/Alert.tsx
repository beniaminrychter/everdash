import type { JSX } from 'preact';
import styles from './Alert.module.css';

export function Alert({ className, ...props }: JSX.IntrinsicElements['output']) {
  return <output className={[styles.alert, className].filter(Boolean).join(' ')} {...props} />;
}
