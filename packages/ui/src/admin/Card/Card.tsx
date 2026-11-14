import type { JSX } from 'preact';
import styles from './Card.module.css';

export function Card({ className, ...props }: JSX.IntrinsicElements['section']) {
  return <section className={[styles.card, className].filter(Boolean).join(' ')} {...props} />;
}

export function CardHeader({ className, ...props }: JSX.IntrinsicElements['header']) {
  return <header className={[styles.header, className].filter(Boolean).join(' ')} {...props} />;
}

export function CardTitle({ children, className, ...props }: JSX.IntrinsicElements['h2']) {
  return (
    <h2 className={[styles.title, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({ className, ...props }: JSX.IntrinsicElements['p']) {
  return <p className={[styles.description, className].filter(Boolean).join(' ')} {...props} />;
}

export function CardContent({ className, ...props }: JSX.IntrinsicElements['div']) {
  return <div className={[styles.content, className].filter(Boolean).join(' ')} {...props} />;
}
