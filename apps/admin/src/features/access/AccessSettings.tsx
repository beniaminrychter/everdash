import { useEffect, useState } from 'preact/hooks';
import styles from '@/AdminEntry.module.css';
import local from './AccessSettings.module.css';
import { AdminDialog } from '@everdash/ui/admin/AdminDialog/AdminDialog';
import { Button } from '@everdash/ui/admin/Button/Button';
import { QRCodeSVG } from '@everdash/ui/admin/QRCode/QRCode';

async function logout() {
  await fetch('/api/manage/auth/logout', {
    method: 'POST',
    headers: { 'X-EverDash-Request': '1' },
  });
  window.location.assign('/admin/');
}

export function AccessSettings() {
  const dashboardUrl = `${window.location.origin}/`;
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [homeAssistant, setHomeAssistant] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch('/api/manage/auth/session', { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : null))
      .then((session: { homeAssistantOrigin?: string } | null) => {
        setHomeAssistant(session?.homeAssistantOrigin ?? '');
      })
      .catch(() => {
        setHomeAssistant('');
      });
  }, []);

  async function disconnect() {
    setDisconnecting(true);
    const response = await fetch('/api/manage/auth/disconnect', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-EverDash-Request': '1' },
    }).catch(() => null);

    if (response?.ok) {
      window.location.assign('/admin/');
      return;
    }

    setDisconnecting(false);
    setConfirmDisconnect(false);
    setMessage('Unable to disconnect Home Assistant.');
  }

  async function save(event: Event) {
    event.preventDefault();
    const response = await fetch('/api/manage/access', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
      body: JSON.stringify({ pin: pin || null }),
    });
    setMessage(response.ok ? 'Dashboard access saved.' : 'Unable to save access settings.');
    if (response.ok) {
      setPin('');
    }
  }
  async function reconnect() {
    const response = await fetch('/api/manage/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
      body: JSON.stringify({ intent: 'reconnect' }),
    });
    if (response.ok) {
      const result = (await response.json()) as { authorizationUrl: string };
      window.location.assign(result.authorizationUrl);
    } else {
      setMessage('Unable to reconnect. Sign in again.');
    }
  }
  return (
    <>
      <section class={styles.login}>
        <form onSubmit={save}>
          <h1>Tablet access</h1>
          <QRCodeSVG
            value={dashboardUrl}
            size={132}
            level="M"
            includeMargin
            aria-label="Dashboard QR code"
          />
          <p>
            <a href={dashboardUrl}>{dashboardUrl}</a>
          </p>
          <p>
            Open <a href="/">the dashboard</a> on your tablet. No pairing is required.
          </p>
          <label>
            New PIN (optional)
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              minLength={4}
              maxLength={6}
              value={pin}
              onInput={(event) => setPin(event.currentTarget.value)}
            />
          </label>
          <p>Use 4–6 digits. Leave empty and save to remove PIN protection.</p>
          <button type="submit">Save access</button>
          {message && <output>{message}</output>}
          <div class={local.connection}>
            <h2>Home Assistant</h2>
            {homeAssistant && (
              <p>
                Connected to <code>{homeAssistant}</code>
              </p>
            )}
            <button type="button" onClick={reconnect}>
              Reconnect Home Assistant
            </button>
            <button type="button" class={local.danger} onClick={() => setConfirmDisconnect(true)}>
              Disconnect…
            </button>
          </div>
          <div class={local.footer}>
            <button type="button" class={local.secondary} onClick={logout}>
              Log out
            </button>
          </div>
        </form>
      </section>
      <AdminDialog
        open={confirmDisconnect}
        onOpenChange={(open) => !disconnecting && setConfirmDisconnect(open)}
        title="Disconnect Home Assistant?"
        description="EverDash forgets this Home Assistant connection and signs you out. Your dashboard layout is kept. Then you can sign in to any Home Assistant instance. Tablets show no data until you connect again."
        className="confirm-dialog"
      >
        <div className="confirm-actions">
          <Button
            variant="outline"
            disabled={disconnecting}
            onClick={() => setConfirmDisconnect(false)}
          >
            Cancel
          </Button>
          <Button variant="destructive" disabled={disconnecting} onClick={disconnect}>
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        </div>
      </AdminDialog>
    </>
  );
}
