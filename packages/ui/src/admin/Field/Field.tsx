import { createContext } from 'preact';
import type { JSX } from 'preact';
import { useContext, useId } from 'preact/hooks';
import styles from './Field.module.css';

const FieldIdContext = createContext<string | undefined>(undefined);

export function useFieldControlId(id?: JSX.IntrinsicElements['input']['id']) {
  const fieldId = useContext(FieldIdContext);
  return id ?? fieldId;
}

export function Field({ className, children, ...props }: JSX.IntrinsicElements['div']) {
  const id = useId();
  return (
    <FieldIdContext.Provider value={id}>
      <div className={[styles.field, className].filter(Boolean).join(' ')} {...props}>
        {children}
      </div>
    </FieldIdContext.Provider>
  );
}

export function FieldLabel({ className, htmlFor, ...props }: JSX.IntrinsicElements['label']) {
  const controlId = useFieldControlId(htmlFor);
  return (
    <label
      className={[styles.label, className].filter(Boolean).join(' ')}
      htmlFor={controlId}
      {...props}
    />
  );
}
