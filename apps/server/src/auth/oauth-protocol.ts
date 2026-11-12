import { parseHomeAssistantOrigin } from './origin';

export interface OAuthGrant {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

export interface OAuthTransportOptions {
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export function authorizeUrl(
  origin: string,
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const url = new URL('/auth/authorize', parseHomeAssistantOrigin(origin));
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    response_type: 'code',
  }).toString();
  return url.toString();
}

async function post(
  origin: string,
  path: string,
  fields: Record<string, string>,
  options: OAuthTransportOptions,
  fallback = false,
): Promise<unknown> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const operation = async () => {
      const response = await (options.fetch ?? fetch)(
        new URL(path, parseHomeAssistantOrigin(origin)),
        {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(fields).toString(),
          redirect: 'error',
          signal: controller.signal,
        },
      );
      if (fallback && response.status === 404) {
        await response.body?.cancel();
        return null;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error('OAuth request failed.');
      }
      if (path === '/auth/revoke' || fields.action === 'revoke') {
        await response.body?.cancel();
        return true;
      }
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('OAuth request failed.');
      }
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const part = await reader.read();
        if (part.done) {
          break;
        }
        size += part.value.byteLength;
        if (size > 65536) {
          await reader.cancel();
          throw new Error('OAuth request failed.');
        }
        chunks.push(part.value);
      }
      return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    };
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('OAuth request failed.'));
        }, options.timeoutMs ?? 10_000);
      }),
    ]);
  } catch {
    throw new Error('OAuth request failed.');
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

function grant(value: unknown, existingRefresh?: string): OAuthGrant {
  if (!value || typeof value !== 'object') {
    throw new Error('OAuth response invalid.');
  }
  const data = value as Record<string, unknown>;
  const refreshToken = data.refresh_token === undefined ? existingRefresh : data.refresh_token;
  if (
    typeof data.access_token !== 'string' ||
    !data.access_token ||
    typeof data.expires_in !== 'number' ||
    !Number.isFinite(data.expires_in) ||
    data.expires_in <= 0 ||
    typeof refreshToken !== 'string' ||
    !refreshToken
  ) {
    throw new Error('OAuth response invalid.');
  }
  return { accessToken: data.access_token, expiresIn: data.expires_in, refreshToken };
}

export async function exchangeCode(
  origin: string,
  clientId: string,
  code: string,
  options: OAuthTransportOptions = {},
): Promise<OAuthGrant> {
  return grant(
    await post(
      origin,
      '/auth/token',
      { grant_type: 'authorization_code', client_id: clientId, code },
      options,
    ),
  );
}

export async function refreshGrant(
  origin: string,
  clientId: string,
  refreshToken: string,
  options: OAuthTransportOptions = {},
): Promise<OAuthGrant> {
  return grant(
    await post(
      origin,
      '/auth/token',
      { grant_type: 'refresh_token', client_id: clientId, refresh_token: refreshToken },
      options,
    ),
    refreshToken,
  );
}

export async function revokeGrant(
  origin: string,
  refreshToken: string,
  options: OAuthTransportOptions = {},
): Promise<void> {
  const result = await post(origin, '/auth/revoke', { token: refreshToken }, options, true);
  if (result === null) {
    await post(origin, '/auth/token', { action: 'revoke', token: refreshToken }, options);
  }
}
