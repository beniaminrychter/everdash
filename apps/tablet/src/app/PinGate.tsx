/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Safari 12 does not support native dialog. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { LanguageProvider, useI18n } from '@everdash/ui/i18n/index';
import {
  readPreferences,
  resolveTheme,
} from '@everdash/dashboard/features/settings/data/preferences';
import type { Preferences } from '@everdash/dashboard/features/settings/data/preferences';
import styles from './PinGate.module.css';

const maxDigits = 6;
const minDigits = 4;
const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** The tablet's saved language and appearance, so the lock screen matches the dashboard. */
function savedPreferences(): Pick<Preferences, 'appearance' | 'language'> {
  try {
    return readPreferences(window.localStorage, [{ id: 'home' }]);
  } catch {
    return { appearance: 'auto', language: 'en' };
  }
}

function KeyIcon({ name }: { name: 'delete' | 'unlock' | 'lock' }) {
  const paths = {
    delete: 'M21 5H8l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zm-9 4 6 6m0-6-6 6',
    unlock: 'M5 12h14m-6-6 6 6-6 6',
    lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zm7 4v2',
  };

  return (
    <svg
      class={name === 'lock' ? styles.lockIcon : styles.keyIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function PinPad({ setupRequired, onUnlock }: { setupRequired: boolean; onUnlock: () => void }) {
  const { t } = useI18n();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Bumped on every failure so the dots shake again even when the message is unchanged.
  const [attempt, setAttempt] = useState(0);
  const latestPin = useRef('');

  latestPin.current = pin;

  function submit(value: string) {
    if (busy || value.length < minDigits) {
      return;
    }

    setBusy(true);
    setError('');

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

        return;
      }

      setAttempt((current) => current + 1);
      setError(
        request.status === 429
          ? t('Too many attempts. Wait a minute and try again.')
          : t('Incorrect PIN. Try again.'),
      );
    });

    const unavailable = () => {
      setBusy(false);
      setPin('');
      setAttempt((current) => current + 1);
      setError(t('Cannot reach EverDash. Check the connection and retry.'));
    };

    request.addEventListener('error', unavailable);
    request.addEventListener('timeout', unavailable);
    request.send(JSON.stringify({ pin: value }));
  }

  function press(key: string) {
    if (busy) {
      return;
    }

    if (key === 'delete') {
      setPin((current) => current.slice(0, -1));

      return;
    }

    if (key === 'unlock') {
      submit(latestPin.current);

      return;
    }

    const next = (latestPin.current + key).slice(0, maxDigits);

    setError('');
    setPin(next);

    // Six digits is the longest PIN, so there is nothing left to wait for.
    if (next.length === maxDigits) {
      submit(next);
    }
  }

  // A hardware keyboard types digits, deletes and submits without focusing a text field, which
  // would raise the on-screen keyboard over the keypad on the iPad.
  useEffect(() => {
    if (setupRequired) {
      return;
    }

    const listener = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = /^[0-9]$/.test(event.key)
        ? event.key
        : event.key === 'Backspace'
          ? 'delete'
          : event.key === 'Enter'
            ? 'unlock'
            : '';

      if (!key) {
        return;
      }

      event.preventDefault();
      press(key);
    };

    document.addEventListener('keydown', listener);

    return () => document.removeEventListener('keydown', listener);
  });

  if (setupRequired) {
    return (
      <section role="dialog" aria-modal="true" aria-labelledby="pin-title" class={styles.panel}>
        <div class={styles.badge}>
          <KeyIcon name="lock" />
        </div>
        <h1 id="pin-title" class={styles.title}>
          {t('Set up EverDash')}
        </h1>
        <p class={styles.subtitle}>
          {t('Finish the setup in administration to choose who can open this dashboard.')}
        </p>
        <a class={styles.setupLink} href="/admin/">
          {t('Open administration')}
        </a>
      </section>
    );
  }

  const slots = [];

  for (let index = 0; index < maxDigits; index += 1) {
    slots.push(
      <span
        key={index}
        class={index < pin.length ? `${styles.dot} ${styles.filled}` : styles.dot}
      />,
    );
  }

  return (
    <section role="dialog" aria-modal="true" aria-labelledby="pin-title" class={styles.panel}>
      <div class={styles.badge}>
        <KeyIcon name="lock" />
      </div>
      <h1 id="pin-title" class={styles.title}>
        {t('Unlock dashboard')}
      </h1>
      <p class={styles.subtitle}>{t('Enter the PIN for this tablet.')}</p>
      <div
        key={attempt}
        class={attempt > 0 && error ? `${styles.dots} ${styles.shake}` : styles.dots}
        role="img"
        aria-label={t('{count} of up to 6 digits entered', { count: String(pin.length) })}
      >
        {slots}
      </div>
      <p class={styles.message} role="alert">
        {busy ? t('Unlocking…') : error}
      </p>
      <div class={styles.keypad}>
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            class={styles.key}
            disabled={busy}
            onClick={() => press(digit)}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          class={`${styles.key} ${styles.action}`}
          disabled={busy || pin.length === 0}
          aria-label={t('Delete')}
          onClick={() => press('delete')}
        >
          <KeyIcon name="delete" />
        </button>
        <button type="button" class={styles.key} disabled={busy} onClick={() => press('0')}>
          0
        </button>
        <button
          type="button"
          class={`${styles.key} ${styles.action} ${styles.unlock}`}
          disabled={busy || pin.length < minDigits}
          aria-label={t('Unlock')}
          onClick={() => press('unlock')}
        >
          <KeyIcon name="unlock" />
        </button>
      </div>
    </section>
  );
}

export function PinGate({
  setupRequired,
  onUnlock,
}: {
  setupRequired: boolean;
  onUnlock: () => void;
}) {
  const [preferences, setPreferences] = useState(savedPreferences);

  // Another tab, such as the dashboard on the same tablet, may change the saved preferences.
  useEffect(() => {
    const listener = () => setPreferences(savedPreferences());

    window.addEventListener('storage', listener);

    return () => window.removeEventListener('storage', listener);
  }, []);

  // The dashboard sets the theme once it loads; the lock screen applies the saved one itself.
  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    document.documentElement.dataset.theme = resolveTheme(preferences.appearance, undefined, dark);
  }, [preferences]);

  return (
    <LanguageProvider language={preferences.language}>
      <main class={styles.gate}>
        <PinPad setupRequired={setupRequired} onUnlock={onUnlock} />
      </main>
    </LanguageProvider>
  );
}
