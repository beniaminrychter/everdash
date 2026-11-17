/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Safari 12 does not support native dialog. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { LanguageProvider, useI18n } from '@everdash/ui/i18n/index';
import {
  readPreferences,
  resolveTheme,
} from '@everdash/dashboard/features/settings/data/preferences';
import type { Preferences } from '@everdash/dashboard/features/settings/data/preferences';
import { detectDeviceType, detectScreenSize } from './deviceInfo';
import { usePreventZoom } from './hooks/usePreventZoom';
import styles from './RegisterDeviceGate.module.css';

const codeLength = 6;
const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** The tablet's saved language and appearance, so the registration screen matches the dashboard. */
function savedPreferences(): Pick<Preferences, 'appearance' | 'language'> {
  try {
    return readPreferences(window.localStorage, [{ id: 'home' }]);
  } catch {
    return { appearance: 'auto', language: 'en' };
  }
}

function KeyIcon({ name }: { name: 'delete' | 'submit' | 'device' }) {
  const paths = {
    delete: 'M21 5H8l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zm-9 4 6 6m0-6-6 6',
    submit: 'M5 12h14m-6-6 6 6-6 6',
    device: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm6 16h.01',
  };

  return (
    <svg
      class={name === 'device' ? styles.badgeIcon : styles.keyIcon}
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

function RegistrationPad({ onRegistered }: { onRegistered: () => void }) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Bumped on every failure so the slots shake again even when the message is unchanged.
  const [attempt, setAttempt] = useState(0);
  const latestCode = useRef('');

  latestCode.current = code;

  function submit(value: string) {
    if (busy || value.length < codeLength) {
      return;
    }

    setBusy(true);
    setError('');

    const request = new XMLHttpRequest();

    request.open('POST', '/api/access/register');
    request.timeout = 10000;
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('X-EverDash-Request', '1');
    request.addEventListener('load', () => {
      setBusy(false);
      setCode('');

      if (request.status === 200) {
        onRegistered();

        return;
      }

      setAttempt((current) => current + 1);
      setError(
        request.status === 429
          ? t('Too many attempts. Wait a minute and try again.')
          : t('Invalid registration code. Try again.'),
      );
    });

    const unavailable = () => {
      setBusy(false);
      setCode('');
      setAttempt((current) => current + 1);
      setError(t('Cannot reach EverDash. Check the connection and retry.'));
    };

    request.addEventListener('error', unavailable);
    request.addEventListener('timeout', unavailable);
    request.send(
      JSON.stringify({
        code: value,
        deviceType: detectDeviceType(),
        screenSize: detectScreenSize(),
      }),
    );
  }

  function press(key: string) {
    if (busy) {
      return;
    }

    if (key === 'delete') {
      setCode((current) => current.slice(0, -1));

      return;
    }

    if (key === 'submit') {
      submit(latestCode.current);

      return;
    }

    const next = (latestCode.current + key).slice(0, codeLength);

    setError('');
    setCode(next);
  }

  // A hardware keyboard types digits, deletes and submits without focusing a text field, which
  // would raise the on-screen keyboard over the keypad on the iPad.
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = /^[0-9]$/.test(event.key)
        ? event.key
        : event.key === 'Backspace'
          ? 'delete'
          : event.key === 'Enter'
            ? 'submit'
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

  const slots = [];

  for (let index = 0; index < codeLength; index += 1) {
    const digit = code[index] ?? '';
    const slotClass = [
      styles.digitSlot,
      digit ? styles.filled : '',
      index === code.length && !busy ? styles.active : '',
    ]
      .filter(Boolean)
      .join(' ');

    slots.push(
      <span key={index} class={slotClass}>
        {digit}
      </span>,
    );
  }

  return (
    <section role="dialog" aria-modal="true" aria-labelledby="register-title" class={styles.panel}>
      <div class={styles.badge}>
        <KeyIcon name="device" />
      </div>
      <h1 id="register-title" class={styles.title}>
        {t('Register device')}
      </h1>
      <p class={styles.subtitle}>
        {t('Enter the registration code from Devices in administration.')}
      </p>
      <div
        key={attempt}
        class={attempt > 0 && error ? `${styles.digits} ${styles.shake}` : styles.digits}
        role="img"
        aria-label={t('{count} of 6 digits entered', { count: String(code.length) })}
      >
        {slots}
      </div>
      <p class={styles.message} role="alert">
        {busy ? t('Registering…') : error}
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
          disabled={busy || code.length === 0}
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
          class={`${styles.key} ${styles.action} ${styles.submit}`}
          disabled={busy || code.length < codeLength}
          aria-label={t('Register')}
          onClick={() => press('submit')}
        >
          <KeyIcon name="submit" />
        </button>
      </div>
    </section>
  );
}

export function RegisterDeviceGate({ onRegistered }: { onRegistered: () => void }) {
  usePreventZoom();
  const [preferences, setPreferences] = useState(savedPreferences);

  // Another tab, such as the dashboard on the same tablet, may change the saved preferences.
  useEffect(() => {
    const listener = () => setPreferences(savedPreferences());

    window.addEventListener('storage', listener);

    return () => window.removeEventListener('storage', listener);
  }, []);

  // The dashboard sets the theme once it loads; the registration screen applies the saved one itself.
  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    document.documentElement.dataset.theme = resolveTheme(preferences.appearance, undefined, dark);
  }, [preferences]);

  return (
    <LanguageProvider language={preferences.language}>
      <main class={styles.gate}>
        <RegistrationPad onRegistered={onRegistered} />
      </main>
    </LanguageProvider>
  );
}
