import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createServer } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStandaloneApp } from '../apps/server/src/standalone';
import { listenWithHostFallback, resolveListenPort } from '../apps/server/src/entry';

test('standalone starts without credentials and protects management', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-standalone-'));
  const { app } = await createStandaloneApp({ dataDirectory: directory, logger: false });
  try {
    assert.equal((await app.inject('/health')).statusCode, 200);
    assert.equal((await app.inject('/api/manage/auth/session')).json().authenticated, false);
    assert.equal(
      (
        await app.inject({
          url: '/api/manage/config',
          headers: { 'x-remote-user-id': 'admin', cookie: 'everdash_device=fake' },
        })
      ).statusCode,
      401,
    );
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('all management data routes reject spoofed identity and device cookies', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-standalone-'));
  const { app } = await createStandaloneApp({ dataDirectory: directory, logger: false });
  try {
    for (const [method, url] of [
      ['GET', '/api/manage/config'],
      ['GET', '/api/manage/config/previous'],
      ['GET', '/api/manage/entities'],
      ['GET', '/api/manage/access'],
      ['GET', '/api/manage/devices'],
      ['POST', '/api/manage/devices/code'],
      ['POST', '/api/manage/config/validate'],
      ['POST', '/api/manage/preview'],
      ['PUT', '/api/manage/config'],
      ['PATCH', '/api/manage/devices/00000000000000000000000000000000'],
      ['DELETE', '/api/manage/devices/00000000000000000000000000000000'],
    ] as const) {
      const response = await app.inject({
        method,
        url,
        headers: {
          'x-remote-user-id': 'admin',
          cookie: 'everdash_device=fake',
          origin: 'http://localhost:80',
          'x-everdash-request': '1',
        },
      });
      assert.equal(response.statusCode, 401, `${method} ${url}`);
    }
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects blanket proxy trust configuration', async () => {
  await assert.rejects(createStandaloneApp({ trustedProxyCidrs: ['0.0.0.0/0'] }), /proxy/i);
  await assert.rejects(createStandaloneApp({ trustedProxyCidrs: ['loopback'] }), /proxy/i);
});

test('imported dashboards require device registration', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-import-'));
  await writeFile(join(directory, 'dashboard.json'), '{}');
  const { app } = await createStandaloneApp({ dataDirectory: directory, logger: false });
  try {
    assert.equal((await app.inject('/api/access')).json().status, 'registration_required');
    assert.equal((await app.inject('/api/ha/states')).statusCode, 401);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('device registration issues a persistent cookie, regenerates single-use code, and unregister clears it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-register-'));
  const { app, tabletAccess } = await createStandaloneApp({
    dataDirectory: directory,
    logger: false,
  });
  try {
    const code = tabletAccess.overview().registrationCode;
    const headers = { origin: 'http://localhost', 'x-everdash-request': '1' };
    const registered = await app.inject({
      method: 'POST',
      url: '/api/access/register',
      headers,
      payload: { code, deviceType: 'iPad', screenSize: '768 × 1024' },
    });
    assert.equal(registered.statusCode, 200);
    const setCookie = String(registered.headers['set-cookie']);
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /Max-Age=315360000/);

    // Code is single-use and cannot be reused.
    const reuse = await app.inject({
      method: 'POST',
      url: '/api/access/register',
      headers,
      payload: { code },
    });
    assert.equal(reuse.statusCode, 401);

    // The issued device cookie stays authorized across requests.
    const session = /everdash_tablet=([^;]+)/.exec(setCookie)?.[1];
    assert.ok(session);
    const cookie = `everdash_tablet=${session}`;
    const status = await app.inject({ method: 'GET', url: '/api/access', headers: { cookie } });
    assert.deepEqual(status.json(), { status: 'registered' });
    const bootstrap = await app.inject({
      method: 'GET',
      url: '/api/bootstrap',
      headers: { cookie },
    });
    assert.notEqual(bootstrap.statusCode, 401);

    const unregistered = await app.inject({
      method: 'POST',
      url: '/api/access/unregister',
      headers: { ...headers, cookie },
    });
    assert.equal(unregistered.statusCode, 200);
    assert.match(String(unregistered.headers['set-cookie']), /Max-Age=0/);
    assert.match(String(unregistered.headers['set-cookie']), /SameSite=Lax/);
    assert.equal(tabletAccess.overview().devices.length, 0);
    assert.equal(
      (await app.inject({ method: 'GET', url: '/api/access', headers: { cookie } })).json().status,
      'registration_required',
    );

    // iOS 12 PWAs omit SameSite so WebKit does not drop the cookie on Home Screen launches.
    const ios12Code = tabletAccess.overview().registrationCode;
    const ios12Headers = {
      ...headers,
      'user-agent':
        'Mozilla/5.0 (iPad; CPU OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    };
    const ios12Registered = await app.inject({
      method: 'POST',
      url: '/api/access/register',
      headers: ios12Headers,
      payload: { code: ios12Code, deviceType: 'iPad', screenSize: '768 × 1024' },
    });
    assert.equal(ios12Registered.statusCode, 200);
    const ios12SetCookie = String(ios12Registered.headers['set-cookie']);
    assert.doesNotMatch(ios12SetCookie, /SameSite=/i);
    const ios12Session = /everdash_tablet=([^;]+)/.exec(ios12SetCookie)?.[1];
    assert.ok(ios12Session);
    const ios12Cookie = `everdash_tablet=${ios12Session}`;
    assert.deepEqual(
      (
        await app.inject({
          method: 'GET',
          url: '/api/access',
          headers: { cookie: ios12Cookie, 'user-agent': ios12Headers['user-agent'] },
        })
      ).json(),
      { status: 'registered' },
    );
    const ios12Unregistered = await app.inject({
      method: 'POST',
      url: '/api/access/unregister',
      headers: { ...ios12Headers, cookie: ios12Cookie },
    });
    assert.equal(ios12Unregistered.statusCode, 200);
    assert.doesNotMatch(String(ios12Unregistered.headers['set-cookie']), /SameSite=/i);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('listenWithHostFallback binds dual-stack by default and falls back to IPv4 when IPv6 is unavailable', async () => {
  const attempts: { host?: string; port: number }[] = [];
  await listenWithHostFallback(
    {
      async listen(options) {
        attempts.push({ host: options?.host, port: Number(options?.port) });
        if (options?.host === '::') {
          const error = Object.assign(new Error('address family not supported'), {
            code: 'EAFNOSUPPORT',
          });
          throw error;
        }

        return 'http://0.0.0.0:8095';
      },
    },
    { port: 8095 },
  );
  assert.deepEqual(attempts, [
    { host: '::', port: 8095 },
    { host: '0.0.0.0', port: 8095 },
  ]);

  const eaddrAttempts: { host?: string; port: number }[] = [];
  await listenWithHostFallback(
    {
      async listen(options) {
        eaddrAttempts.push({ host: options?.host, port: Number(options?.port) });
        if (options?.host === '::') {
          const error = Object.assign(new Error('cannot assign requested address'), {
            code: 'EADDRNOTAVAIL',
          });
          throw error;
        }

        return 'http://0.0.0.0:8095';
      },
    },
    { host: '   ', port: 8095 },
  );
  assert.deepEqual(eaddrAttempts, [
    { host: '::', port: 8095 },
    { host: '0.0.0.0', port: 8095 },
  ]);

  await assert.rejects(
    listenWithHostFallback(
      {
        async listen() {
          throw Object.assign(new Error('port in use'), { code: 'EADDRINUSE' });
        },
      },
      { port: 8095 },
    ),
    /port in use/,
  );

  const explicitAttempts: { host?: string; port: number }[] = [];
  await assert.rejects(
    listenWithHostFallback(
      {
        async listen(options) {
          explicitAttempts.push({ host: options?.host, port: Number(options?.port) });
          throw Object.assign(new Error('cannot assign requested address'), {
            code: 'EADDRNOTAVAIL',
          });
        },
      },
      { host: '127.0.0.1', port: 8095 },
    ),
    /cannot assign requested address/,
  );
  assert.deepEqual(explicitAttempts, [{ host: '127.0.0.1', port: 8095 }]);
});

test('standalone server serves health over both IPv4 and IPv6 when dual-stack is active', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-dualstack-'));
  const { app } = await createStandaloneApp({ dataDirectory: directory, logger: false });
  try {
    await listenWithHostFallback(app, { port: 0 });
    const address = app.server.address();
    assert.ok(address && typeof address !== 'string');
    const ipv4Response = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(ipv4Response.status, 200);
    if (address.family === 'IPv6') {
      const ipv6Response = await fetch(`http://[::1]:${address.port}/health`);
      assert.equal(ipv6Response.status, 200);
    }
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('resolveListenPort honors EVERDASH_PORT and reads Supervisor Network port overrides via socket', async () => {
  assert.equal(await resolveListenPort({ env: {} }), 8095);
  assert.equal(
    await resolveListenPort({
      env: { EVERDASH_PORT: '9001', SUPERVISOR_SOCKET: '/nonexistent/supervisor.sock' },
    }),
    9001,
  );
  await assert.rejects(
    resolveListenPort({ env: { EVERDASH_PORT: 'not-a-port' } }),
    /Invalid EVERDASH_PORT/,
  );

  const socketRoot = tmpdir().length <= 60 ? tmpdir() : '/tmp';
  const directory = await mkdtemp(join(socketRoot, 'ed-sock-'));
  const socketPath = join(directory, 'sup.sock');
  let networkPort: number | null = 8089;
  const server = createServer((req, res) => {
    if (req.url === '/addons/self/info') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ result: 'ok', data: { network: { '8095/tcp': networkPort } } }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  try {
    await new Promise<void>((resolve) => {
      server.listen(socketPath, resolve);
    });

    assert.equal(await resolveListenPort({ env: { SUPERVISOR_SOCKET: socketPath } }), 8089);

    networkPort = null;
    assert.equal(await resolveListenPort({ env: { SUPERVISOR_SOCKET: socketPath } }), 8095);

    assert.equal(
      await resolveListenPort({
        env: { SUPERVISOR_SOCKET: join(directory, 'missing.sock') },
        timeoutMs: 250,
      }),
      8095,
    );
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await rm(directory, { recursive: true, force: true });
  }
});
