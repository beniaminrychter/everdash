import type { CatalogApi, ClimateApi, ClimateCommand, ServiceCommand } from './contracts';

export type { CatalogApi, ClimateApi, HomeAssistantApi, ServiceCommand } from './contracts';

export class HomeAssistantError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
  ) {
    super(message);
    this.name = 'HomeAssistantError';
  }
}

export type HomeAssistantClient = CatalogApi & ClimateApi;
export type HomeAssistantClientFactory = (baseUrl?: string) => HomeAssistantClient;

export function createClient(baseUrl = ''): HomeAssistantClient {
  const requests = new Set<XMLHttpRequest>();

  function request(method: 'GET' | 'POST', path: string, data?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      requests.add(xhr);
      const fail = (message: string, status = 0) => reject(new HomeAssistantError(message, status));
      xhr.open(method, `${baseUrl}${path}`);
      xhr.timeout = 10_000;
      xhr.setRequestHeader('Accept', 'application/json');
      if (data !== undefined) {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-EverDash-Request', '1');
      }
      xhr.addEventListener('load', () => {
        if (xhr.status === 401) {
          let code = '';
          try {
            const body: unknown = JSON.parse(xhr.responseText);
            if (
              typeof body === 'object' &&
              body !== null &&
              'code' in body &&
              typeof body.code === 'string'
            ) {
              code = body.code;
            }
          } catch {
            code = '';
          }
          fail(
            code.startsWith('HA_')
              ? 'EverDash could not connect to Home Assistant.'
              : 'This device is not paired or authorized.',
            401,
          );
          return;
        }
        if (xhr.status === 403) {
          fail('This request is not allowed.', 403);
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
      xhr.addEventListener('error', () => fail('Cannot reach Home Assistant through EverDash.'));
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
      await request(
        'POST',
        `api/ha/services/${encodeURIComponent(command.domain)}/${encodeURIComponent(command.service)}`,
        command.data,
      );
    },
    getState: (entityId) => request('GET', `api/ha/states/${encodeURIComponent(entityId)}`),
    getStates: () => request('GET', 'api/ha/states'),
    getWeatherForecast: (entityId) =>
      request('POST', 'api/ha/services/weather/get_forecasts', {
        entity_id: entityId,
        type: 'hourly',
      }),
  };
}
