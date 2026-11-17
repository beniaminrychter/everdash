import type { ComponentChildren } from 'preact';
import styles from './Disclosure.module.css';

interface DisclosureProps {
  summary: ComponentChildren;
  children: ComponentChildren;
  class?: string;
}

/** A native collapsible section; every disclosure in the tablet app uses this one style. */
export function Disclosure({ summary, children, class: className = '' }: DisclosureProps) {
  return (
    <details class={`${styles.disclosure} ${className}`}>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
