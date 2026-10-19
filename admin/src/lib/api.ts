import type { DashboardDocument } from '../../../src/shared/config/types';

export interface EntityOption {
  entityId: string;
  name: string;
  domain: string;
  state: string;
  available: boolean;
  unit: string | null;
  deviceClass: string | null;
  icon: string | null;
}

export interface DeviceRecord {
  id: string;
  label: string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}

export interface AccessInfo {
  hostName: string | null;
  addresses: string[];
  httpPort: number | null;
  httpsPort: number | null;
  errors: string[];
}

export interface ManagedConfig {
  revision: string | null;
  config: DashboardDocument;
  previousAvailable: boolean;
  configured: boolean;
  recovery?: boolean;
  diagnostic?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' } : {}),
      ...init?.headers,
    },
    ...init,
  });
  const result = (await response.json()) as T & {
    message?: string;
    code?: string;
    issues?: unknown;
  };
  if (!response.ok) {
    const error = new Error(
      result.message || `EverDash request failed (${response.status}).`,
    ) as Error & {
      status?: number;
      code?: string;
      issues?: unknown;
    };
    error.status = response.status;
    error.code = result.code;
    error.issues = result.issues;
    throw error;
  }
  return result;
}

export const api = {
  getConfig: () => request<ManagedConfig>('api/manage/config'),
  getPreviousConfig: () => request<{ config: DashboardDocument }>('api/manage/config/previous'),
  saveConfig: (revision: string | null, config: DashboardDocument) =>
    request<{ revision: string; config: DashboardDocument }>('api/manage/config', {
      method: 'PUT',
      body: JSON.stringify({ baseRevision: revision, config }),
    }),
  validateConfig: (config: unknown) =>
    request<{ config: DashboardDocument }>('api/manage/config/validate', {
      method: 'POST',
      body: JSON.stringify({ config }),
    }),
  getEntities: (query: string, domain: string) => {
    const params = new URLSearchParams({ q: query, limit: '60' });
    if (domain) {
      params.set('domain', domain);
    }
    return request<{ entities: EntityOption[]; total: number }>(`api/manage/entities?${params}`);
  },
  getAccess: () => request<AccessInfo>('api/manage/access'),
  getDevices: () => request<DeviceRecord[]>('api/manage/devices'),
  approvePairing: (code: string, label: string) =>
    request<{ approved: boolean }>('api/manage/pairings/approve', {
      method: 'POST',
      body: JSON.stringify({ code, label }),
    }),
  revokeDevice: (id: string) =>
    request<{ revoked: boolean }>(`api/manage/devices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    }),
  preview: (config: DashboardDocument) =>
    request<{ config: DashboardDocument; states: unknown[] }>('api/manage/preview', {
      method: 'POST',
      body: JSON.stringify({ config }),
    }),
};
