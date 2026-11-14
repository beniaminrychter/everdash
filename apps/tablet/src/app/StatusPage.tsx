import styles from './StatusPage.module.css';

export function StatusPage({
  message,
  onRetry,
}: {
  mode?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <main class={styles.gate}>
      <section class={styles.panel}>
        <h1>EverDash</h1>
        <p role="alert">
          {message ?? 'Configure the dashboard in administration, or retry the connection.'}
        </p>
        {onRetry && (
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        )}
        <p>
          <a href="/admin/">Open administration</a>
        </p>
      </section>
    </main>
  );
}
