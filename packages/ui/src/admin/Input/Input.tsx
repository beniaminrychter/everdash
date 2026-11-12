import type { JSX } from 'preact';
import { useFieldControlId } from '../Field/Field';
import styles from './Input.module.css';

export function Input({ className, id, ...props }: JSX.IntrinsicElements['input']) {
  const controlId = useFieldControlId(id);
  return (
    <input
      className={[styles.input, className].filter(Boolean).join(' ')}
      id={controlId}
      {...props}
    />
  );
}

export function Textarea({ className, id, ...props }: JSX.IntrinsicElements['textarea']) {
  const controlId = useFieldControlId(id);
  return (
    <textarea
      className={[styles.textarea, className].filter(Boolean).join(' ')}
      id={controlId}
      {...props}
    />
  );
}
