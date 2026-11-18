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
  let reachable = true;
  let discoverCalls = 0;
  let discoverExtra: readonly string[] | undefined;
  const coordinator = new OAuthCoordinator({
    repository,
    provider,
    probe: async () => {
      if (!reachable) {
        throw new Error('unreachable');
      }
    },
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
    discover: async (extraOrigins) => {
      discoverCalls += 1;
      discoverExtra = extraOrigins;
      await new Promise((resolve) => setTimeout(resolve, 15));

      return [{ origin: 'http://192.168.1.50:8123', source: 'mdns', name: 'Home' }];
    },
  });
  const app = Fastify({ trustProxy });
  registerOAuthRoutes(app, coordinator);
  return {
    app,
    coordinator,
    repository,
    provider,
    getDiscoverCalls: () => discoverCalls,
    getDiscoverExtra: () => discoverExtra,
    setAdmin: (value: boolean) => {
      admin = value;
    },
    setReachable: (value: boolean) => {
      reachable = value;
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

test('start refuses a Home Assistant address the server cannot reach', async (t) => {
  const f = fixture();
  t.after(f.close);
  f.setReachable(false);
  const response = await start(f.app);
  assert.equal(response.statusCode, 502);
  assert.deepEqual(response.json(), { error: 'HA_UNREACHABLE' });
  assert.equal(response.headers['set-cookie'], undefined);
});

test('callback accepts the storeToken flag Home Assistant appends after login', async (t) => {
  const f = fixture();
  t.after(f.close);
  const tx = transaction(await start(f.app));
  const callback = await f.app.inject({
    method: 'GET',
    url: `/api/manage/auth/callback?code=abc&state=${tx.state}&storeToken=true`,
    headers: { host: headers.host, cookie: tx.cookie },
  });
  assert.equal(callback.headers.location, '/admin/');
  assert.equal(f.repository.status().state, 'connected');
});

test('administrator can disconnect and then connect a different instance', async (t) => {
  const f = fixture();
  t.after(f.close);
  const tx = transaction(await start(f.app));
  const callback = await f.app.inject({
    url: `/api/manage/auth/callback?state=${tx.state}&code=one`,
    headers: { host: headers.host, cookie: tx.cookie },
  });
  const adminCookie = (callback.headers['set-cookie'] as string[])
    .find((item) => item.startsWith('everdash_admin='))!
    .split(';')[0];
  const session = await f.app.inject({
    url: '/api/manage/auth/session',
    headers: { host: headers.host, cookie: adminCookie },
  });
  assert.equal(session.json().homeAssistantOrigin, 'http://ha:8123');
  const anonymous = await f.app.inject({
    url: '/api/manage/auth/session',
    headers: { host: headers.host },
  });
  assert.equal(anonymous.json().homeAssistantOrigin, 'http://ha:8123');

  const refused = await f.app.inject({
    method: 'POST',
    url: '/api/manage/auth/disconnect',
    headers,
  });
  assert.equal(refused.statusCode, 401);
  const forged = await f.app.inject({
    method: 'POST',
    url: '/api/manage/auth/disconnect',
    headers: { host: headers.host, cookie: adminCookie },
  });
  assert.equal(forged.statusCode, 403);
  assert.equal(f.repository.status().state, 'connected');

  const disconnected = await f.app.inject({
    method: 'POST',
    url: '/api/manage/auth/disconnect',
    headers: { ...headers, cookie: adminCookie },
  });
  assert.equal(disconnected.statusCode, 200);
  assert.match(String(disconnected.headers['set-cookie']), /Max-Age=0/);
  assert.equal(f.repository.status().state, 'unconfigured');
  const after = await f.app.inject({
    url: '/api/manage/auth/session',
    headers: { host: headers.host, cookie: adminCookie },
  });
  assert.equal(after.json().authenticated, false);

  const next = transaction(await start(f.app, { homeAssistantOrigin: 'http://other-ha:8123' }));
  await f.app.inject({
    url: `/api/manage/auth/callback?state=${next.state}&code=two`,
    headers: { host: headers.host, cookie: next.cookie },
  });
  assert.equal(f.repository.readCredentials()?.origin, 'http://other-ha:8123');
});

test('discover enforces origin/header, allows unconfigured setup, requires admin when connected, and coalesces scans', async (t) => {
  const f = fixture();
  t.after(f.close);

  const forged = await f.app.inject({
    method: 'POST',
    url: '/api/manage/auth/discover',
    headers: { host: headers.host },
  });
  assert.equal(forged.statusCode, 403);

  const [firstScan, secondScan] = await Promise.all([
    f.app.inject({ method: 'POST', url: '/api/manage/auth/discover', headers }),
    f.app.inject({ method: 'POST', url: '/api/manage/auth/discover', headers }),
  ]);
  assert.equal(firstScan.statusCode, 200);
  assert.equal(secondScan.statusCode, 200);
  assert.equal(f.getDiscoverCalls(), 1);
  assert.deepEqual(firstScan.json().instances, [
    { origin: 'http://192.168.1.50:8123', source: 'mdns', name: 'Home' },
  ]);

  const tx = transaction(await start(f.app));
  const callback = await f.app.inject({
    url: `/api/manage/auth/callback?state=${tx.state}&code=one`,
    headers: { host: headers.host, cookie: tx.cookie },
  });
  const adminCookie = (callback.headers['set-cookie'] as string[])
    .find((item) => item.startsWith('everdash_admin='))!
    .split(';')[0];

  const anonymous = await f.app.inject({
    method: 'POST',
    url: '/api/manage/auth/discover',
    headers,
  });
  assert.equal(anonymous.statusCode, 401);

  const authorized = await f.app.inject({
    method: 'POST',
    url: '/api/manage/auth/discover',
    headers: { ...headers, cookie: adminCookie },
  });
  assert.equal(authorized.statusCode, 200);
  assert.deepEqual(f.getDiscoverExtra(), ['http://ha:8123']);
});
