import type { ComponentChildren } from 'preact';
import styles from './Widget.module.css';

interface WidgetProps {
  title: string;
  titleId: string;
  headerAction?: ComponentChildren;
  children: ComponentChildren;
}

export function Widget({ title, titleId, headerAction, children }: WidgetProps) {
  return (
    <section class={styles.widget} aria-labelledby={titleId}>
      <div class={styles.header}>
        <h2 id={titleId}>{title}</h2>
        {headerAction}
      </div>
      {children}
    </section>
  );
}
