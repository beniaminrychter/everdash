import { useCallback, useEffect, useState } from 'preact/hooks';
import { useI18n } from '../../../../shared/i18n/index';
import type { Translator } from '../../../../shared/i18n/index';
import type { DeviceInfo } from '../../data/contracts';
import styles from './PairingPanel.module.css';

type PairingMode = 'tablet' | 'manager';
interface PairingRequest {
  requestId: string;
  code: string;
  pollSecret: string;
  expiresAt: number;
}

interface PairingPanelProps {
  mode: PairingMode;
}

async function callApi<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, path);
    xhr.timeout = 10_000;
    xhr.setRequestHeader('Accept', 'application/json');
    if (body !== undefined) {
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-EverDash-Request', '1');
    }
    xhr.addEventListener('load', () => {
      let response: unknown;
      try {
        response = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error('The server returned an invalid response.'));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        const message =
          typeof response === 'object' &&
          response !== null &&
          'message' in response &&
          typeof response.message === 'string'
            ? response.message
            : 'The request failed. Try again.';
        reject(new Error(message));
        return;
      }
      resolve(response as T);
    });
    xhr.addEventListener('error', () =>
      reject(new Error('Cannot reach EverDash. Check the connection and retry.')),
    );
    xhr.addEventListener('timeout', () =>
      reject(new Error('EverDash did not respond in time. Try again.')),
    );
    xhr.send(body === undefined ? null : JSON.stringify(body));
  });
}

function DevicePairing({ t }: { t: Translator }) {
  const [pairing, setPairing] = useState<PairingRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const start = async () => {
    if (busy || pairing) {
      return;
    }
    setBusy(true);
    setError('');
    setMessage(t('Starting a secure pairing request…'));
    try {
      const request = await callApi<PairingRequest>('POST', 'api/pairings', {});
      setPairing(request);
      setMessage(t('Waiting for approval in Home Assistant…'));
    } catch (error) {
      setMessage('');
      setError(error instanceof Error ? error.message : t('Pairing could not start. Retry.'));
    }
    setBusy(false);
  };

  useEffect(() => {
    if (!pairing) {
      return;
    }
    let polling = false;
    const timer = window.setInterval(() => {
      if (polling) {
        return;
      }
      polling = true;
      const poll = async () => {
        try {
          const response = await callApi<{ status: string }>('POST', 'api/pairings/status', {
            requestId: pairing.requestId,
            pollSecret: pairing.pollSecret,
          });
          if (response.status === 'approved') {
            setPairing(null);
            setMessage(t('Pairing complete. Opening your dashboard…'));
            window.setTimeout(() => window.location.reload(), 300);
          } else if (response.status === 'expired') {
            setPairing(null);
            setMessage(t('This code expired. Start a new pairing request.'));
          }
        } catch (error) {
          setError(
            error instanceof Error ? error.message : t('Pairing status could not be checked.'),
          );
        }
        polling = false;
      };
      poll();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [pairing, t]);

  return (
    <section class={styles.panel} aria-labelledby="pairing-title">
      <h2 id="pairing-title">{t('Pair this tablet')}</h2>
      <p>
        {t(
          'Open EverDash through a trusted HTTPS address, then approve this code in Home Assistant.',
        )}
      </p>
      {pairing && (
        <p class={styles.code} aria-label={t('Pairing code')}>
          {pairing.code}
        </p>
      )}
      {pairing && <p>{t('Code expires in five minutes.')}</p>}
      <div class={styles.actions}>
        <button type="button" onClick={start} disabled={busy || Boolean(pairing)}>
          {pairing ? t('Waiting for approval…') : busy ? t('Starting…') : t('Start pairing')}
        </button>
        {pairing && (
          <button
            type="button"
            onClick={() => {
              setPairing(null);
              setMessage(t('Pairing request cancelled.'));
            }}
          >
            {t('Cancel pairing')}
          </button>
        )}
      </div>
      <output class={styles.status} aria-live="polite">
        {message}
      </output>
      {error && (
        <p class={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function ManagerPairing({ t }: { t: Translator }) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setDevices(await callApi<DeviceInfo[]>('GET', 'api/manage/devices'));
    } catch (error) {
      setError(error instanceof Error ? error.message : t('Device list could not be loaded.'));
    }
  }, [t]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const approve = async (event: Event) => {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await callApi('POST', 'api/manage/pairings/approve', { code, label });
      setCode('');
      setLabel('');
      setMessage(t('Approved. The tablet will appear after it redeems the code.'));
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : t('Pairing approval failed. Try again.'));
    }
    setBusy(false);
  };

  const revoke = async (device: DeviceInfo) => {
    setError('');
    try {
      await callApi('DELETE', `api/manage/devices/${encodeURIComponent(device.id)}`, {});
      setDevices(await callApi<DeviceInfo[]>('GET', 'api/manage/devices'));
      setMessage(t('Device access revoked.'));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : t('Device could not be revoked. Try again.'),
      );
    }
  };

  return (
    <section class={styles.panel} aria-labelledby="pairing-title">
      <h2 id="pairing-title">{t('Paired tablets')}</h2>
      <p>{t('Enter the code shown on the tablet, choose a label, then approve it.')}</p>
      <form class={styles.form} onSubmit={approve}>
        <label for="pairing-code">{t('Pairing code')}</label>
        <input
          id="pairing-code"
          value={code}
          onInput={(event) => setCode((event.currentTarget as HTMLInputElement).value)}
          autoComplete="off"
          maxLength={8}
          required
        />
        <label for="device-label">{t('Device label')}</label>
        <input
          id="device-label"
          value={label}
          onInput={(event) => setLabel((event.currentTarget as HTMLInputElement).value)}
          autoComplete="off"
          maxLength={80}
          required
        />
        <div class={styles.actions}>
          <button type="submit" disabled={busy || code.trim().length !== 8 || !label.trim()}>
            {busy ? t('Approving…') : t('Approve device')}
          </button>
        </div>
      </form>
      <output class={styles.status} aria-live="polite">
        {message}
      </output>
      {error && (
        <p class={styles.error} role="alert">
          {error}
        </p>
      )}
      <ul class={styles.deviceList} aria-label={t('Devices')}>
        {devices.map((device) => (
          <li class={styles.device} key={device.id}>
            <strong>{device.label}</strong>
            <span>{device.revokedAt === null ? t('Active') : t('Revoked')}</span>
            {device.revokedAt === null && (
              <button type="button" onClick={async () => revoke(device)}>
                {t('Revoke access')}
              </button>
            )}
          </li>
        ))}
      </ul>
      <button type="button" onClick={refresh}>
        {t('Refresh devices')}
      </button>
    </section>
  );
}

export function PairingPanel({ mode }: PairingPanelProps) {
  const { t } = useI18n();
  return mode === 'manager' ? <ManagerPairing t={t} /> : <DevicePairing t={t} />;
}
