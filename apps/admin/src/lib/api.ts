import type { AuthSessionResponse } from '@everdash/contracts/auth/oauth';
import type { DashboardDocument } from '@everdash/contracts/config/types';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';

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

export interface ManagedConfig {
  revision: string | null;
  config: DashboardDocument;
  previousAvailable: boolean;
  configured: boolean;
  recovery?: boolean;
  diagnostic?: string;
}

/** Thrown for any 401, so the app can return to sign-in from one place. */
export class UnauthorizedError extends Error {
  readonly status = 401;

  constructor(message = m.admin_session_expired()) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Runs `listener` whenever any API call gets a 401. Returns an unsubscribe function. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);

  return () => {
    unauthorizedListeners.delete(listener);
  };
}

function directoryOf(pathname: string): string {
  if (pathname.endsWith('/')) {
    return pathname;
  }

  const lastSlash = pathname.lastIndexOf('/');

  return lastSlash !== -1 ? pathname.slice(0, lastSlash + 1) : '/';
}

export function adminHomeUrl(pathname = window.location.pathname): string {
  return directoryOf(pathname);
}

export function apiUrl(path: string, pathname = window.location.pathname): string {
  const normalized = path.replace(/^\/+/, '');
  const dir = directoryOf(pathname);
  const root = dir.endsWith('/admin/') ? dir.slice(0, -'admin/'.length) : dir;

  return `${root}${normalized}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' } : {}),
      ...init?.headers,
    },
    ...init,
  });

  if (response.status === 401) {
    const error = new UnauthorizedError();

    for (const listener of unauthorizedListeners) {
      listener();
    }

    throw error;
  }

  const result = (await response.json()) as T & {
    message?: string;
    code?: string;
    issues?: unknown;
  };

  if (!response.ok) {
    const error = new Error(
      result.message || m.admin_request_failed({ status: response.status }),
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
  getSession: () => request<AuthSessionResponse>('api/manage/auth/session'),
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
  getEntities: (query: string, domain: string | readonly string[]) => {
    const params = new URLSearchParams({ q: query, limit: '60' });

    const domains = typeof domain === 'string' ? domain : domain.join(',');

    if (domains) {
      params.set('domain', domains);
    }

    return request<{ entities: EntityOption[]; total: number }>(`api/manage/entities?${params}`);
  },
  preview: (config: DashboardDocument) =>
    request<{
      config: DashboardDocument;
      states: unknown[];
      forecasts: Record<string, readonly unknown[]>;
    }>('api/manage/preview', {
      method: 'POST',
      body: JSON.stringify({ config }),
    }),
};
