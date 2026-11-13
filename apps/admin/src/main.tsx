import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { authErrorMessage, takeAuthErrorFromUrl } from './authErrors';
import { AdminApp } from './ui/AdminApp';
import type { AuthSessionResponse } from '../../../packages/contracts/src/auth/oauth';
import styles from './AdminEntry.module.css';
import './index.css';

const root = document.querySelector('#root');

function AdminEntry() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [connected, setConnected] = useState(false);
  const [savedOrigin, setSavedOrigin] = useState('');
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState(takeAuthErrorFromUrl);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/manage/auth/session', { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to check the admin session.');
        }
        return response.json();
      })
      .then((session: AuthSessionResponse) => {
        setConnected(session.connection !== 'unconfigured');
        setSavedOrigin(session.homeAssistantOrigin ?? '');
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
      const result = (await response.json()) as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) {
        setError(authErrorMessage(result.error ?? 'INVALID_REQUEST'));
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
        {connected && savedOrigin && (
          <p>
            Home Assistant: <code>{savedOrigin}</code>
          </p>
        )}
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
        {connected && (
          <small>
            To use a different Home Assistant, sign in and choose Disconnect under Tablet access. If
            you cannot sign in, reset the saved connection with{' '}
            <code>npm run reset-connection</code> (or <code>--reset-connection</code> on the
            server).
          </small>
        )}
      </form>
    </main>
  );
}

if (root) {
  render(<AdminEntry />, root);
}
