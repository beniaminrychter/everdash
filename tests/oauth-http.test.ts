import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import Fastify from 'fastify';
import { ConnectorRepository } from '../apps/server/src/auth/connector-repository';
import { HouseholdCredentialProvider } from '../apps/server/src/auth/credential-provider';
import { OAuthCoordinator } from '../apps/server/src/auth/oauth-coordinator';
import { registerOAuthRoutes } from '../apps/server/src/auth/oauth-http';

const origin = 'http://192.168.1.2:8124';
const headers = { host: '192.168.1.2:8124', origin, 'x-everdash-request': '1' };
function fixture(trustProxy: boolean | string = false) {
  const directory = mkdtempSync(join(tmpdir(), 'oauth-http-'));
  const repository = new ConnectorRepository({ directory });
  const provider = new HouseholdCredentialProvider({ repository });
  let admin = true;
  const coordinator = new OAuthCoordinator({
    repository,
    provider,
    exchange: async (_origin, _client, code) => ({
      accessToken: `access-${code}`,
      refreshToken: `refresh-${code}`,
      expiresIn: 3600,
    }),
    verify: async () => {
      if (!admin) {
        throw new Error('private identity');
      }
      return { id: 'admin' };
    },
    revoke: async () => {},
  });
  const app = Fastify({ trustProxy });
  registerOAuthRoutes(app, coordinator);
  return {
    app,
    coordinator,
    repository,
    provider,
    setAdmin: (value: boolean) => {
      admin = value;
    },
    close: async () => {
      await app.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
async function start(app: ReturnType<typeof Fastify>, extra = {}) {
  return app.inject({
    method: 'POST',
    url: '/api/manage/auth/start',
    headers,
    payload: { intent: 'login', homeAssistantOrigin: 'http://ha:8123', ...extra },
  });
}
function transaction(response: Awaited<ReturnType<typeof start>>) {
  const url = new URL(response.json().authorizationUrl);
  return {
    state: url.searchParams.get('state')!,
    cookie: String(response.headers['set-cookie']).split(';')[0],
  };
}

test('start and callback establish a session without exposing secrets', async (t) => {
  const f = fixture();
  t.after(f.close);
  const started = await start(f.app);
  assert.equal(started.statusCode, 200);
  assert.deepEqual(Object.keys(started.json()), ['authorizationUrl']);
  assert.match(
    String(started.headers['set-cookie']),
    /Path=\/api\/manage\/auth; HttpOnly; SameSite=Lax; Max-Age=600/,
  );
  const tx = transaction(started);
  const callback = await f.app.inject({
    method: 'GET',
    url: `/api/manage/auth/callback?state=${tx.state}&code=secret`,
    headers: { host: headers.host, cookie: tx.cookie },
  });
  assert.equal(callback.statusCode, 302);
  assert.equal(callback.headers.location, '/admin/');
  assert.ok(Array.isArray(callback.headers['set-cookie']));
  assert.match(String(callback.headers['set-cookie']), /SameSite=Strict/);
  assert.doesNotMatch(callback.body, /secret|state|access|refresh/);
  const adminCookie = (callback.headers['set-cookie'] as string[])
    .find((item) => item.startsWith('everdash_admin='))!
    .split(';')[0];
  const status = await f.app.inject({
    method: 'GET',
    url: '/api/manage/auth/session',
    headers: { host: headers.host, cookie: adminCookie },
  });
  assert.equal(status.json().authenticated, true);
  assert.doesNotMatch(status.body, /refresh|access|generation|clientId|admin=/);
  const logout = await f.app.inject({
    method: 'POST',
    url: '/api/manage/auth/logout',
    headers: { ...headers, cookie: adminCookie },
  });
  assert.match(String(logout.headers['set-cookie']), /Max-Age=0/);
  assert.equal(
    (
      await f.app.inject({
        method: 'GET',
        url: '/api/manage/auth/session',
        headers: { host: headers.host, cookie: adminCookie },
      })
    ).json().authenticated,
    false,
  );
  assert.equal((await f.provider.get()).accessToken, 'access-secret');
});

test('rejects origin/header violations and unauthenticated reconnect', async (t) => {
  const f = fixture();
  t.after(f.close);
  for (const bad of [{ origin: 'http://evil' }, { 'x-everdash-request': '0' }, { origin: '' }]) {
    const response = await f.app.inject({
      method: 'POST',
      url: '/api/manage/auth/start',
      headers: { ...headers, ...bad },
      payload: { intent: 'login', homeAssistantOrigin: 'http://ha:8123' },
    });
    assert.equal(response.statusCode, 403);
  }
  assert.equal((await start(f.app, { intent: 'reconnect' })).statusCode, 401);
});

test('failed and replayed callbacks clear transaction and never install credentials', async (t) => {
  const f = fixture();
  t.after(f.close);
  const tx = transaction(await start(f.app));
  f.setAdmin(false);
  const response = await f.app.inject({
    url: `/api/manage/auth/callback?state=${tx.state}&code=private`,
    headers: { host: headers.host, cookie: tx.cookie },
  });
  assert.equal(response.headers.location, '/admin/?auth_error=AUTH_FAILED');
  assert.match(String(response.headers['set-cookie']), /Max-Age=0/);
  assert.doesNotMatch(response.body + response.headers.location, /private/);
  assert.equal(f.repository.status().state, 'unconfigured');
  f.setAdmin(true);
  const replay = await f.app.inject({
    url: `/api/manage/auth/callback?state=${tx.state}&code=x`,
    headers: { host: headers.host, cookie: tx.cookie },
  });
  assert.equal(replay.headers.location, '/admin/?auth_error=INVALID_REQUEST');
});

test('forwarded authority is ignored unless the peer is trusted', async (t) => {
  const untrusted = fixture();
  const trusted = fixture('127.0.0.1/32');
  t.after(untrusted.close);
  t.after(trusted.close);
  const forwarded = {
    host: 'internal:3000',
    origin: 'https://[::1]:8443',
    'x-everdash-request': '1',
    'x-forwarded-host': '[::1]:8443',
    'x-forwarded-proto': 'https',
  };
  const options = {
    method: 'POST' as const,
    url: '/api/manage/auth/start',
    headers: forwarded,
    payload: { intent: 'login', homeAssistantOrigin: 'http://ha:8123' },
    remoteAddress: '127.0.0.1',
  };
  assert.equal((await untrusted.app.inject(options)).statusCode, 403);
  const response = await trusted.app.inject(options);
  assert.equal(response.statusCode, 200);
  assert.equal(
    new URL(response.json().authorizationUrl).searchParams.get('client_id'),
    'https://[::1]:8443',
  );
  assert.match(String(response.headers['set-cookie']), /Secure/);
});

test('admin guard rejects device cookies and stale generations', async (t) => {
  const f = fixture();
  t.after(f.close);
  const { requireAdmin } = await import('../apps/server/src/auth/oauth-http');
  f.app.get('/guard', async (request, reply) => {
    if (!requireAdmin(request, reply, f.coordinator)) {
      return reply;
    }
    return { ok: true };
  });
  const tx = transaction(await start(f.app));
  const callback = await f.app.inject({
    url: `/api/manage/auth/callback?state=${tx.state}&code=one`,
    headers: { host: headers.host, cookie: tx.cookie },
  });
  const adminCookie = (callback.headers['set-cookie'] as string[])
    .find((item) => item.startsWith('everdash_admin='))!
    .split(';')[0];
  assert.equal(
    (await f.app.inject({ url: '/guard', headers: { cookie: 'everdash_device=dummy' } }))
      .statusCode,
    401,
  );
  assert.equal(
    (await f.app.inject({ url: '/guard', headers: { cookie: adminCookie } })).statusCode,
    200,
  );
  const reconnect = await f.app.inject({
    method: 'POST',
    url: '/api/manage/auth/start',
    headers: { ...headers, cookie: adminCookie },
    payload: { intent: 'reconnect' },
  });
  const next = transaction(reconnect);
  await f.app.inject({
    url: `/api/manage/auth/callback?state=${next.state}&code=two`,
    headers: { host: headers.host, cookie: next.cookie },
  });
  assert.equal(
    (await f.app.inject({ url: '/guard', headers: { cookie: adminCookie } })).statusCode,
    401,
  );
});

test('callback rejects another browser, origin, duplicate query and cookies', async (t) => {
  const f = fixture();
  t.after(f.close);
  const cases = [
    (tx: ReturnType<typeof transaction>) => ({
      url: `/api/manage/auth/callback?state=${tx.state}&code=x`,
      cookie: 'everdash_oauth=wrong',
      host: headers.host,
    }),
    (tx: ReturnType<typeof transaction>) => ({
      url: `/api/manage/auth/callback?state=${tx.state}&code=x`,
      cookie: tx.cookie,
      host: 'other:8124',
    }),
    (tx: ReturnType<typeof transaction>) => ({
      url: `/api/manage/auth/callback?state=${tx.state}&state=${tx.state}&code=x`,
      cookie: tx.cookie,
      host: headers.host,
    }),
    (tx: ReturnType<typeof transaction>) => ({
      url: `/api/manage/auth/callback?state=${tx.state}&code=x`,
      cookie: `${tx.cookie}; ${tx.cookie}`,
      host: headers.host,
    }),
  ];
  for (const make of cases) {
    const item = make(transaction(await start(f.app)));
    const response = await f.app.inject({
      url: item.url,
      headers: { host: item.host, cookie: item.cookie },
    });
    assert.equal(response.headers.location, '/admin/?auth_error=INVALID_REQUEST');
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['referrer-policy'], 'no-referrer');
  }
  assert.equal(f.repository.status().state, 'unconfigured');
});
