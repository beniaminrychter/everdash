import type { DashboardDocument } from '../../../shared/config/types';
import type { ConfigIssue } from '../../../shared/config/validate';

export interface RuntimeSnapshot {
  revision: string;
  config: DashboardDocument;
}

export interface ManagedConfig extends RuntimeSnapshot {
  previousAvailable: boolean;
  configured: boolean;
}

function request<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
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
        reject(new Error('EverDash returned an invalid response.'));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        const error = new Error(
          typeof response === 'object' && response !== null && 'message' in response
            ? String(response.message)
            : 'The request failed. Try again.',
        ) as Error & { status?: number; code?: string; issues?: ConfigIssue[] };
        error.status = xhr.status;
        if (typeof response === 'object' && response !== null) {
          if ('code' in response && typeof response.code === 'string') {
            error.code = response.code;
          }
          if ('issues' in response && Array.isArray(response.issues)) {
            error.issues = response.issues as ConfigIssue[];
          }
        }
        reject(error);
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

export const configurationApi = {
  get: () => request<ManagedConfig>('GET', 'api/manage/config'),
  validate: (config: unknown) =>
    request<{ config: DashboardDocument }>('POST', 'api/manage/config/validate', { config }),
  save: (baseRevision: string | null, config: unknown) =>
    request<RuntimeSnapshot>('PUT', 'api/manage/config', { baseRevision, config }),
  previous: () => request<{ config: DashboardDocument }>('GET', 'api/manage/config/previous'),
};
