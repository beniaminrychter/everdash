import type { CatalogApi, ClimateApi, ClimateCommand, ServiceCommand } from './contracts';

export type { CatalogApi, ClimateApi, HomeAssistantApi, ServiceCommand } from './contracts';

export interface Connection {
  url: string;
  token: string;
}

export class HomeAssistantError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
  ) {
    super(message);
    this.name = 'HomeAssistantError';
  }
}

export function validateConnection(rawUrl: string, rawToken: string): Connection {
  const token = rawToken.trim();
  if (!rawUrl.trim() || !token) {
    throw new Error(
      'Set VITE_HOME_ASSISTANT_URL and VITE_HOME_ASSISTANT_TOKEN in .env, then restart or rebuild the app.',
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Invalid Home Assistant URL.');
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      'Invalid Home Assistant URL. Use an HTTP(S) server address without credentials, query, or fragment.',
    );
  }
  return { token, url: parsed.href.replace(/\/+$/, '') };
}

export function createClient(connection: Connection): CatalogApi & ClimateApi {
  const requests = new Set<XMLHttpRequest>();
  function request(method: 'GET' | 'POST', path: string, data?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      requests.add(xhr);
      const fail = (message: string, status = 0) => reject(new HomeAssistantError(message, status));
      xhr.open(method, `${connection.url}/api/${path}`);
      xhr.timeout = 10_000;
      xhr.setRequestHeader('Authorization', `Bearer ${connection.token}`);
      xhr.setRequestHeader('Accept', 'application/json');
      if (data !== undefined) {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }
      xhr.addEventListener('load', () => {
        if (xhr.status === 401 || xhr.status === 403) {
          fail('Home Assistant rejected the token. Check .env and rebuild.', xhr.status);
          return;
        }
        if (xhr.status === 404) {
          fail('Entity not found in Home Assistant.', 404);
          return;
        }
        if (xhr.status < 200 || xhr.status >= 300) {
          fail(`Home Assistant request failed (HTTP ${xhr.status}).`, xhr.status);
          return;
        }
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          fail('Home Assistant returned invalid JSON.');
        }
      });
      xhr.addEventListener('error', () =>
        fail('Cannot reach Home Assistant. Check the URL, connection, HTTPS, and CORS settings.'),
      );
      xhr.addEventListener('timeout', () =>
        fail('Home Assistant did not respond within 10 seconds.'),
      );
      xhr.addEventListener('abort', () => fail('Home Assistant request cancelled.'));
      xhr.addEventListener('loadend', () => requests.delete(xhr));
      xhr.send(data === undefined ? null : JSON.stringify(data));
    });
  }
  return {
    abort: () => {
      requests.forEach((xhr) => xhr.abort());
      requests.clear();
    },
    callService: async (command: ServiceCommand | ClimateCommand) => {
      await request('POST', `services/${command.domain}/${command.service}`, command.data);
    },
    getState: (entityId) =>
      request('GET', `states/${encodeURIComponent(entityId)}?_=${Date.now()}`),
    getStates: () => request('GET', `states?_=${Date.now()}`),
    getWeatherForecast: (entityId) =>
      request('POST', 'services/weather/get_forecasts?return_response', {
        entity_id: entityId,
        type: 'hourly',
      }),
  };
}
