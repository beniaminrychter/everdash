import type { IncomingHttpHeaders } from 'node:http';
import { HomeAssistantUpstreamError } from './errors';

const API_ROOT = 'http://supervisor/core/api/';
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 10_000;

export interface HomeAssistantTransport {
  getStates: (signal?: AbortSignal) => Promise<unknown>;
  getState: (entityId: string, signal?: AbortSignal) => Promise<unknown>;
  callService: (
    domain: string,
    service: string,
    data: Record<string, unknown>,
    signal?: AbortSignal,
  ) => Promise<unknown>;
}

export interface SupervisorHomeAssistantOptions {
  token: string;
  request?: typeof fetch;
}

export interface HomeAssistantClientOptions {
  apiRoot: string;
  token: string;
  request?: typeof fetch;
}

async function readBoundedResponse(response: Response): Promise<string> {
  if (!response.body) {
    return '';
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new HomeAssistantUpstreamError(
          'Home Assistant response is too large.',
          502,
          'HA_RESPONSE_TOO_LARGE',
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function responseError(status: number, headers: IncomingHttpHeaders): HomeAssistantUpstreamError {
  const messages: Record<number, [string, string]> = {
    401: ['Home Assistant rejected the server credential.', 'HA_UNAUTHORIZED'],
    403: ['Home Assistant denied the request.', 'HA_FORBIDDEN'],
    404: ['The configured Home Assistant entity or service was not found.', 'HA_NOT_FOUND'],
  };
  const [message, code] = messages[status] ?? [
    'Home Assistant request failed.',
    'HA_UPSTREAM_ERROR',
  ];
  return new HomeAssistantUpstreamError(
    `${message}${headers['retry-after'] ? ' Retry later.' : ''}`,
    status,
    code,
  );
}

function validateApiRoot(apiRoot: string): string {
  let url: URL;
  try {
    url = new URL(apiRoot);
  } catch {
    throw new Error('A valid Home Assistant API root is required.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    /[?#]/.test(apiRoot) ||
    !['/api/', '/core/api/'].includes(url.pathname) ||
    !apiRoot.endsWith('/')
  ) {
    throw new Error('A valid Home Assistant API root is required.');
  }
  return url.href;
}

export function createHomeAssistantClient(
  options: HomeAssistantClientOptions,
): HomeAssistantTransport {
  const apiRoot = validateApiRoot(options.apiRoot);
  const request = options.request ?? fetch;

  async function call(
    method: 'GET' | 'POST',
    path: string,
    data?: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await request(new URL(path, apiRoot), {
        method,
        headers: {
          Authorization: `Bearer ${options.token}`,
          Accept: 'application/json',
          ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
        signal: signal
          ? AbortSignal.any([AbortSignal.timeout(REQUEST_TIMEOUT_MS), signal])
          : AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        redirect: 'error',
      });
    } catch (error) {
      if (error instanceof HomeAssistantUpstreamError) {
        throw error;
      }
      const timeout = error instanceof Error && error.name === 'TimeoutError';
      throw new HomeAssistantUpstreamError(
        timeout
          ? 'Home Assistant did not respond within 10 seconds.'
          : 'Cannot reach Home Assistant.',
        timeout ? 504 : 502,
        timeout ? 'HA_TIMEOUT' : 'HA_UNAVAILABLE',
      );
    }
    if (!response.ok) {
      throw responseError(response.status, Object.fromEntries(response.headers.entries()));
    }
    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      throw new HomeAssistantUpstreamError(
        'Home Assistant response is too large.',
        502,
        'HA_RESPONSE_TOO_LARGE',
      );
    }
    const text = await readBoundedResponse(response);
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      throw new HomeAssistantUpstreamError(
        'Home Assistant returned invalid JSON.',
        502,
        'HA_INVALID_JSON',
      );
    }
  }

  return {
    getStates: (signal) => call('GET', 'states', undefined, signal),
    getState: (entityId, signal) =>
      call('GET', `states/${encodeURIComponent(entityId)}`, undefined, signal),
    callService: (domain, service, data, signal) => {
      const returnResponse =
        domain === 'weather' && service === 'get_forecasts' ? '?return_response' : '';
      return call(
        'POST',
        `services/${encodeURIComponent(domain)}/${encodeURIComponent(service)}${returnResponse}`,
        data,
        signal,
      );
    },
  };
}

export function createSupervisorHomeAssistant(
  options: SupervisorHomeAssistantOptions,
): HomeAssistantTransport {
  return createHomeAssistantClient({ apiRoot: API_ROOT, ...options });
}
