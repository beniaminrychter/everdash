/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Safari 12 does not support native dialog. */
import { useState } from 'preact/hooks';
import styles from './PinGate.module.css';

export function PinGate({
  setupRequired,
  onUnlock,
}: {
  setupRequired: boolean;
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function unlock(event: Event) {
    event.preventDefault();
    setBusy(true);
    const request = new XMLHttpRequest();
    request.open('POST', '/api/access/unlock');
    request.timeout = 10000;
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('X-EverDash-Request', '1');
    request.addEventListener('load', () => {
      setBusy(false);
      setPin('');
      if (request.status === 200) {
        onUnlock();
      } else {
        setError(
          request.status === 429
            ? 'Too many attempts. Wait a minute.'
            : 'Incorrect PIN. Try again.',
        );
      }
    });
    const unavailable = () => {
      setBusy(false);
      setError('Cannot reach EverDash.');
    };
    request.addEventListener('error', unavailable);
    request.addEventListener('timeout', unavailable);
    request.send(JSON.stringify({ pin }));
  }
  return (
    <main class={styles.gate}>
      <section role="dialog" aria-modal="true" aria-labelledby="pin-title" class={styles.panel}>
        <h1 id="pin-title">{setupRequired ? 'Set up EverDash' : 'Unlock dashboard'}</h1>
        {setupRequired ? (
          <p>
            Open <a href="/admin/">administration</a> to configure dashboard access.
          </p>
        ) : (
          <form onSubmit={unlock}>
            <label>
              PIN
              <input
                autoComplete="off"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                maxLength={6}
                value={pin}
                onInput={(event) =>
                  setPin(event.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 6))
                }
              />
            </label>
            <div class={styles.keypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Delete', '0'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setPin((current) =>
                      digit === 'Delete' ? current.slice(0, -1) : (current + digit).slice(0, 6),
                    )
                  }
                >
                  {digit}
                </button>
              ))}
            </div>
            {error && <p role="alert">{error}</p>}
            <button class={styles.unlock} type="submit" disabled={busy || pin.length < 4}>
              {busy ? 'Unlocking…' : 'Unlock'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
