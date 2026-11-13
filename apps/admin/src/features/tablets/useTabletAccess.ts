import { useCallback, useEffect, useState } from 'react';

export interface PairedDevice {
  id: string;
  label: string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}

/** Null while loading; 'unavailable' when the status could not be read. */
type AccessStatus = 'open' | 'pin_required' | 'setup_required' | 'unavailable' | null;

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path, { credentials: 'same-origin' });

    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

async function readStatus(): Promise<AccessStatus> {
  const result = await readJson<{ status: AccessStatus }>('/api/manage/access');

  return result?.status ?? 'unavailable';
}

export function useTabletAccess() {
  const [status, setStatus] = useState<AccessStatus>(null);
  const [devices, setDevices] = useState<PairedDevice[]>([]);

  useEffect(() => {
    let active = true;

    readStatus().then((result) => {
      if (active) {
        setStatus(result);
      }
    });
    readJson<PairedDevice[]>('/api/manage/devices').then((result) => {
      if (active) {
        setDevices(Array.isArray(result) ? result : []);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  /** Sends the same payload as the old form: a PIN of four to six digits, or null to remove it. */
  const save = useCallback(async (pin: string | null): Promise<boolean> => {
    try {
      const response = await fetch('/api/manage/access', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
        body: JSON.stringify({ pin: pin || null }),
      });

      if (response.ok) {
        setStatus(await readStatus());
      }

      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return { status, devices, save };
}
