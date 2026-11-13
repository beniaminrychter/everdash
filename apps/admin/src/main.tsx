import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { AdminApp } from './ui/AdminApp';
import styles from './AdminEntry.module.css';
import './index.css';

const root = document.querySelector('#root');

function AdminEntry() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [connected, setConnected] = useState(false);
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState(() =>
    new URLSearchParams(window.location.search).has('auth_error')
      ? 'Home Assistant login failed. Please try again with an administrator account.'
      : '',
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/manage/auth/session', { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to check the admin session.');
        }
        return response.json();
      })
      .then((session: { authenticated: boolean; connection: string }) => {
        setConnected(session.connection !== 'unconfigured');
        setAuthenticated(session.authenticated);
      })
      .catch(() => {
        setError('Unable to connect to EverDash.');
        setAuthenticated(false);
      });
  }, []);

  async function signIn(event: Event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/manage/auth/start', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
        body: JSON.stringify({
          intent: 'login',
          ...(origin ? { homeAssistantOrigin: origin } : {}),
        }),
      });
      const result = (await response.json()) as { authorizationUrl?: string };
      if (!response.ok || !result.authorizationUrl) {
        setError('Could not start Home Assistant login. Check the address and try again.');
        setBusy(false);
        return;
      }
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not start login.');
      setBusy(false);
    }
  }

  if (authenticated === null) {
    return <p>Checking your session…</p>;
  }
  if (authenticated) {
    return <AdminApp />;
  }
  return (
    <main class={styles.login}>
      <form onSubmit={signIn}>
        <h1>EverDash</h1>
        <p>Sign in with a Home Assistant administrator account.</p>
        {!connected && (
          <label>
            Home Assistant URL
            <input
              type="url"
              value={origin}
              onInput={(event) => setOrigin(event.currentTarget.value)}
              placeholder="http://homeassistant.local:8123"
              required
            />
          </label>
        )}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Connecting…' : 'Continue with Home Assistant'}
        </button>
      </form>
    </main>
  );
}

if (root) {
  render(<AdminEntry />, root);
}
