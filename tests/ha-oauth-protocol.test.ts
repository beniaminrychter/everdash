import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  authorizeUrl,
  exchangeCode,
  refreshGrant,
  revokeGrant,
} from '../apps/server/src/auth/oauth-protocol';
import { verifyAdmin } from '../apps/server/src/auth/admin-identity';

const origin = 'http://192.168.1.5:8123';
const clientId = 'http://192.168.1.8:8095/exact';
const callback = 'http://192.168.1.8:8095/callback';

test('authorize URL preserves caller values', () => {
  const url = new URL(authorizeUrl(origin, clientId, callback, 'state +'));
  assert.equal(url.origin + url.pathname, `${origin}/auth/authorize`);
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    client_id: clientId,
    redirect_uri: callback,
    state: 'state +',
    response_type: 'code',
  });
});

test('grants send form fields with exact client ID and validate responses', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const transport: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init: init! });
    return Response.json(
      calls.length === 1
        ? { access_token: 'access', expires_in: 123, refresh_token: 'refresh' }
        : { access_token: 'next', expires_in: 45 },
    );
  };
  assert.deepEqual(await exchangeCode(origin, clientId, 'code', { fetch: transport }), {
    accessToken: 'access',
    expiresIn: 123,
    refreshToken: 'refresh',
  });
  assert.deepEqual(await refreshGrant(origin, clientId, 'refresh', { fetch: transport }), {
    accessToken: 'next',
    expiresIn: 45,
    refreshToken: 'refresh',
  });
  assert.deepEqual(
    calls.map((call) => Object.fromEntries(new URLSearchParams(String(call.init.body)))),
    [
      { grant_type: 'authorization_code', client_id: clientId, code: 'code' },
      { grant_type: 'refresh_token', client_id: clientId, refresh_token: 'refresh' },
    ],
  );
  assert.ok(
    calls.every((call) => call.url === `${origin}/auth/token` && call.init.redirect === 'error'),
  );
  for (const value of [
    { access_token: '', expires_in: 1, refresh_token: 'x' },
    { access_token: 'x', expires_in: 0, refresh_token: 'x' },
    { access_token: 'x', expires_in: 1 },
  ]) {
    await assert.rejects(
      exchangeCode(origin, clientId, 'secret', {
        fetch: async () => Response.json(value),
      }),
      /OAuth/,
    );
  }
  await assert.rejects(
    exchangeCode(origin, clientId, 'secret', {
      fetch: async () => {
        throw new Error('secret');
      },
    }),
    (error: Error) => !error.message.includes('secret'),
  );
  await assert.rejects(
    exchangeCode(origin, clientId, 'secret', { fetch: () => new Promise(() => {}), timeoutMs: 10 }),
    /OAuth/,
  );
});

test('revocation falls back only on 404', async () => {
  const calls: [string, string][] = [];
  await revokeGrant(origin, 'secret', {
    fetch: async (url, init) => {
      calls.push([String(url), String(init?.body)]);
      return new Response(null, { status: calls.length === 1 ? 404 : 200 });
    },
  });
  assert.deepEqual(calls, [
    [`${origin}/auth/revoke`, 'token=secret'],
    [`${origin}/auth/token`, 'action=revoke&token=secret'],
  ]);
  let count = 0;
  await assert.rejects(
    revokeGrant(origin, 'secret', {
      fetch: async () => {
        count++;
        return new Response(null, { status: 500 });
      },
    }),
    /OAuth/,
  );
  assert.equal(count, 1);
});

class FakeSocket {
  listeners = new Map<string, ((event: { data: unknown }) => void)[]>();
  sent: unknown[] = [];
  closed = false;
  addEventListener(type: string, listener: (event: { data: unknown }) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.closed = true;
  }
  emit(type: string, data?: unknown) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ data });
    }
  }
  frame(value: unknown) {
    this.emit('message', JSON.stringify(value));
  }
}

test('WebSocket authenticates and requests current user before accepting admin', async () => {
  const socket = new FakeSocket();
  let url = '';
  const result = verifyAdmin(origin, 'secret', {
    socketFactory: (value) => {
      url = value;
      return socket;
    },
  });
  socket.frame({ type: 'auth_required' });
  socket.frame({ type: 'auth_ok' });
  assert.deepEqual(socket.sent, [
    { type: 'auth', access_token: 'secret' },
    { id: 1, type: 'auth/current_user' },
  ]);
  socket.frame({ id: 1, type: 'result', success: true, result: { id: 'user', is_admin: true } });
  assert.deepEqual(await result, { id: 'user' });
  assert.equal(url, 'ws://192.168.1.5:8123/api/websocket');
  assert.equal(socket.closed, true);
});

test('WebSocket rejects invalid frames, nonadmins, close, and timeout with cleanup', async () => {
  for (const outcome of [
    'nonadmin',
    'wrongid',
    'malformed',
    'binary',
    'close',
    'timeout',
    'invalid',
  ]) {
    const socket = new FakeSocket();
    const result = verifyAdmin(origin, 'secret', { socketFactory: () => socket, timeoutMs: 10 });
    if (outcome === 'close') {
      socket.emit('close');
    } else if (outcome === 'malformed') {
      socket.emit('message', '{');
    } else if (outcome === 'binary') {
      socket.emit('message', Buffer.from('x'));
    } else if (outcome === 'invalid') {
      socket.frame({ type: 'auth_invalid' });
    } else if (outcome !== 'timeout') {
      socket.frame({ type: 'auth_required' });
      socket.frame({ type: 'auth_ok' });
      socket.frame({
        id: outcome === 'wrongid' ? 2 : 1,
        type: 'result',
        success: true,
        result: { id: 'u', is_admin: false, is_owner: true },
      });
    }
    await assert.rejects(result, /identity/i);
    assert.equal(socket.closed, true, outcome);
  }
});
