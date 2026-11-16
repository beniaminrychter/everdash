import type { ComponentChildren } from 'preact';
import styles from './Widget.module.css';

interface WidgetProps {
  title: string;
  titleId: string;
  headerAction?: ComponentChildren;
  className?: string;
  children: ComponentChildren;
}

export function Widget({ title, titleId, headerAction, className, children }: WidgetProps) {
  const classes = [styles.widget, className].filter(Boolean).join(' ');

  return (
    <section class={classes} aria-labelledby={titleId}>
      <div class={styles.header}>
        <h2 id={titleId}>{title}</h2>
        {headerAction}
      </div>
      {children}
    </section>
  );
}
