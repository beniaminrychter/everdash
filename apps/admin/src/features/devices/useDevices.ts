import { useCallback, useEffect, useState } from 'react';
import type { DevicesOverview, RegisteredDevice } from '@everdash/contracts/auth/devices';
import { apiUrl } from '@/lib/api';

export async function readDevicesOverview(): Promise<DevicesOverview | null> {
  try {
    const response = await fetch(apiUrl('api/manage/devices'), { credentials: 'same-origin' });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as Partial<DevicesOverview>;

    if (typeof body.registrationCode !== 'string' || !Array.isArray(body.devices)) {
      return null;
    }

    return {
      registrationCode: body.registrationCode,
      codeCreatedAt: typeof body.codeCreatedAt === 'number' ? body.codeCreatedAt : 0,
      devices: body.devices,
    };
  } catch {
    return null;
  }
}

export function useDevices() {
  const [registrationCode, setRegistrationCode] = useState<string | null>(null);
  const [codeCreatedAt, setCodeCreatedAt] = useState<number | null>(null);
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const overview = await readDevicesOverview();

    if (overview) {
      setRegistrationCode(overview.registrationCode);
      setCodeCreatedAt(overview.codeCreatedAt);
      setDevices(overview.devices);
      setError(false);
    } else {
      setError(true);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    const refreshIfActive = async () => {
      const overview = await readDevicesOverview();

      if (!active) {
        return;
      }

      if (overview) {
        setRegistrationCode(overview.registrationCode);
        setCodeCreatedAt(overview.codeCreatedAt);
        setDevices(overview.devices);
        setError(false);
      } else {
        setError(true);
      }

      setLoading(false);
    };

    refreshIfActive();

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshIfActive();
      }
    }, 4000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshIfActive();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const regenerateCode = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(apiUrl('api/manage/devices/code'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-EverDash-Request': '1' },
      });

      if (!response.ok) {
        return false;
      }

      const body = (await response.json()) as { registrationCode: string; codeCreatedAt: number };

      setRegistrationCode(body.registrationCode);
      setCodeCreatedAt(body.codeCreatedAt);

      return true;
    } catch {
      return false;
    }
  }, []);

  const renameDevice = useCallback(async (id: string, name: string): Promise<boolean> => {
    try {
      const response = await fetch(apiUrl(`api/manage/devices/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        return false;
      }

      const body = (await response.json()) as { device: RegisteredDevice };

      setDevices((current) => current.map((device) => (device.id === id ? body.device : device)));

      return true;
    } catch {
      return false;
    }
  }, []);

  const removeDevice = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(apiUrl(`api/manage/devices/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'X-EverDash-Request': '1' },
      });

      if (!response.ok) {
        return false;
      }

      setDevices((current) => current.filter((device) => device.id !== id));

      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    registrationCode,
    codeCreatedAt,
    devices,
    loading,
    error,
    refresh: load,
    regenerateCode,
    renameDevice,
    removeDevice,
  };
}
