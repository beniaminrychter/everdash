import type { ComponentChildren } from 'preact';
import styles from './Widget.module.css';

interface WidgetProps {
  title: string;
  titleId: string;
  headerAction?: ComponentChildren;
  className?: string;
  /** Keeps the title as the card's accessible name but takes no room for it. */
  hideTitle?: boolean;
  children: ComponentChildren;
}

export function Widget({
  title,
  titleId,
  headerAction,
  className,
  hideTitle = false,
  children,
}: WidgetProps) {
  const classes = [styles.widget, className].filter(Boolean).join(' ');

  return (
    <section class={classes} aria-labelledby={titleId}>
      <div class={hideTitle ? `${styles.header} ${styles.titleless}` : styles.header}>
        <h2 id={titleId} class={hideTitle ? styles.hiddenTitle : undefined}>
          {title}
        </h2>
        {headerAction}
      </div>
      {children}
    </section>
  );
}
