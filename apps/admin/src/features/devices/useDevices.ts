import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  DashboardAddressesResponse,
  DashboardAddressInfo,
  DashboardAddressReasonCode,
  DevicesOverview,
  RegisteredDevice,
} from '@everdash/contracts/auth/devices';
import { apiUrl } from '@/lib/api';

const REASON_CODES = new Set<DashboardAddressReasonCode>([
  'connection_refused',
  'timeout',
  'dns_failed',
  'tls_error',
  'wrong_service',
  'network_unreachable',
  'unknown',
]);

function parseAddressInfo(value: unknown): DashboardAddressInfo | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as {
    url?: unknown;
    reachable?: unknown;
    reasonCode?: unknown;
    httpStatus?: unknown;
  };

  if (typeof record.url !== 'string' || typeof record.reachable !== 'boolean') {
    return null;
  }

  const info: DashboardAddressInfo = {
    url: record.url,
    reachable: record.reachable,
  };

  if (
    typeof record.reasonCode === 'string' &&
    REASON_CODES.has(record.reasonCode as DashboardAddressReasonCode)
  ) {
    info.reasonCode = record.reasonCode as DashboardAddressReasonCode;
  }

  if (typeof record.httpStatus === 'number' && Number.isInteger(record.httpStatus)) {
    info.httpStatus = record.httpStatus;
  }

  return info;
}

const ADDRESSES_STORAGE_PREFIX = 'everdash:dashboard-addresses:v1:';

function addressesStorageKey(): string {
  return `${ADDRESSES_STORAGE_PREFIX}${window.location.origin}`;
}

function readCachedDashboardAddresses(): DashboardAddressesResponse | null {
  try {
    const raw = window.localStorage.getItem(addressesStorageKey());

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<DashboardAddressesResponse> | null;

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return {
      local: parseAddressInfo(parsed.local),
      external: parseAddressInfo(parsed.external),
    };
  } catch {
    return null;
  }
}

function saveCachedDashboardAddresses(addresses: DashboardAddressesResponse): void {
  try {
    window.localStorage.setItem(addressesStorageKey(), JSON.stringify(addresses));
  } catch {
    // Ignore storage errors in restricted contexts.
  }
}

export async function readDashboardAddresses(): Promise<DashboardAddressesResponse | null> {
  try {
    const query = encodeURIComponent(window.location.origin);
    const response = await fetch(apiUrl(`api/manage/devices/addresses?origin=${query}`), {
      credentials: 'same-origin',
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as Partial<DashboardAddressesResponse>;

    return {
      local: parseAddressInfo(body.local),
      external: parseAddressInfo(body.external),
    };
  } catch {
    return null;
  }
}

export function useDashboardAddresses() {
  const [addresses, setAddresses] = useState<DashboardAddressesResponse | null>(
    readCachedDashboardAddresses,
  );
  const [initialLoading, setInitialLoading] = useState(() => addresses === null);
  const [rechecking, setRechecking] = useState(false);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const refreshInBackground = async () => {
      const result = await readDashboardAddresses();

      if (!mountedRef.current || requestIdRef.current !== requestId) {
        return;
      }

      if (result) {
        saveCachedDashboardAddresses(result);
        setAddresses(result);
      } else {
        setAddresses((current) => current ?? { local: null, external: null });
      }

      setInitialLoading(false);
    };

    refreshInBackground();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const recheck = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setRechecking(true);

    const result = await readDashboardAddresses();

    if (!mountedRef.current || requestIdRef.current !== requestId) {
      return;
    }

    if (result) {
      saveCachedDashboardAddresses(result);
      setAddresses(result);
    } else {
      setAddresses((current) => current ?? { local: null, external: null });
    }

    setInitialLoading(false);
    setRechecking(false);
  }, []);

  return {
    addresses,
    initialLoading,
    rechecking,
    recheck,
  };
}

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
