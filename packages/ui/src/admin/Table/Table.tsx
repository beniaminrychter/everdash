import type { JSX } from 'preact';
import styles from './Table.module.css';

export function Table({ className, ...props }: JSX.IntrinsicElements['table']) {
  return (
    <div className={styles.wrap}>
      <table className={[styles.table, className].filter(Boolean).join(' ')} {...props} />
    </div>
  );
}

export function TableHead(props: JSX.IntrinsicElements['thead']) {
  return <thead {...props} />;
}

export function TableBody(props: JSX.IntrinsicElements['tbody']) {
  return <tbody {...props} />;
}

export function TableRow(props: JSX.IntrinsicElements['tr']) {
  return <tr {...props} />;
}

export function TableHeader(props: JSX.IntrinsicElements['th']) {
  return <th {...props} />;
}

export function TableCell(props: JSX.IntrinsicElements['td']) {
  return <td {...props} />;
}
