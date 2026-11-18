import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStandaloneApp } from '../apps/server/src/standalone';
import {
  listenWithHostFallback,
  resolveIngressNetwork,
  resolveIngressPort,
  resolveListenPort,
} from '../apps/server/src/entry';

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

test('resolveIngressPort reads Supervisor ingress settings and supports env overrides', async () => {
  assert.equal(await resolveIngressPort({ env: {} }), undefined);
  assert.equal(await resolveIngressPort({ env: { EVERDASH_INGRESS_PORT: '0' } }), undefined);
  assert.equal(await resolveIngressPort({ env: { EVERDASH_INGRESS_PORT: 'off' } }), undefined);
  assert.equal(await resolveIngressPort({ env: { EVERDASH_INGRESS_PORT: '8105' } }), 8105);
  await assert.rejects(
    resolveIngressPort({ env: { EVERDASH_INGRESS_PORT: 'invalid' } }),
    /Invalid EVERDASH_INGRESS_PORT/,
  );

  const socketRoot = tmpdir().length <= 60 ? tmpdir() : '/tmp';
  const directory = await mkdtemp(join(socketRoot, 'ed-ing-'));
  const socketPath = join(directory, 'sup.sock');
  let ingressEnabled = true;
  let ingressPort: number | null = 62345;
  const server = createServer((req, res) => {
    if (req.url === '/addons/self/info') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          result: 'ok',
          data: { ingress: ingressEnabled, ingress_port: ingressPort },
        }),
      );
      return;
    }

    res.writeHead(404);
    res.end();
  });

  try {
    await new Promise<void>((resolve) => {
      server.listen(socketPath, resolve);
    });

    assert.equal(await resolveIngressPort({ env: { SUPERVISOR_SOCKET: socketPath } }), 62345);

    ingressEnabled = false;
    assert.equal(await resolveIngressPort({ env: { SUPERVISOR_SOCKET: socketPath } }), undefined);

    ingressEnabled = true;
    ingressPort = null;
    assert.equal(await resolveIngressPort({ env: { SUPERVISOR_SOCKET: socketPath } }), undefined);

    assert.equal(
      await resolveIngressPort({
        env: { SUPERVISOR_SOCKET: join(directory, 'missing.sock') },
        timeoutMs: 250,
      }),
      8099,
    );
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await rm(directory, { recursive: true, force: true });
  }
});

test('resolveIngressNetwork selects matching bridge interface and honors explicit overrides', async () => {
  const network = await resolveIngressNetwork({
    env: {},
    lookupSupervisor: async () => ['172.30.32.2'],
    interfaces: () => ({
      lo: [
        {
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: true,
          cidr: '127.0.0.1/8',
        },
      ],
      hassio: [
        {
          address: '172.30.32.1',
          netmask: '255.255.254.0',
          family: 'IPv4',
          mac: '02:42:ac:1e:20:01',
          internal: false,
          cidr: '172.30.32.1/23',
        },
      ],
    }),
  });
  assert.deepEqual(network, {
    bindHost: '172.30.32.1',
    allowedProxyIps: ['172.30.32.2'],
  });

  const overridden = await resolveIngressNetwork({
    env: {
      EVERDASH_INGRESS_HOST: '127.0.0.1',
      EVERDASH_INGRESS_PROXY_IPS: '127.0.0.1, ::1',
    },
  });
  assert.deepEqual(overridden, {
    bindHost: '127.0.0.1',
    allowedProxyIps: ['127.0.0.1', '::1'],
  });
});

test('Ingress listener grants zero-login admin and Supervisor HA access while rejecting non-proxy peers', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-ingress-'));
  const adminDir = join(directory, 'admin');
  const tabletDir = join(directory, 'tablet');
  await Promise.all([mkdir(adminDir), mkdir(tabletDir)]);
  await Promise.all([
    writeFile(join(adminDir, 'index.html'), '<main>Admin</main>'),
    writeFile(join(tabletDir, 'index.html'), '<main>Tablet</main>'),
  ]);

  const seenTokens: string[] = [];
  const haMock = createServer((req, res) => {
    seenTokens.push(String(req.headers.authorization ?? ''));
    if (req.url === '/core/api/states') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify([
          {
            entity_id: 'light.living_room',
            state: 'on',
            attributes: { friendly_name: 'Living Room' },
          },
        ]),
      );
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => {
    haMock.listen(0, '127.0.0.1', resolve);
  });
  const haAddress = haMock.address();
  assert.ok(haAddress && typeof haAddress !== 'string');

  const { app, ingressApp, tabletAccess } = await createStandaloneApp({
    dataDirectory: join(directory, 'data'),
    staticDirectory: tabletDir,
    adminStaticDirectory: adminDir,
    logger: false,
    supervisorToken: 'supervisor-secret-token',
    supervisorApiRoot: `http://127.0.0.1:${haAddress.port}/core/api/`,
    ingress: {
      allowedProxyIps: ['172.30.32.2'],
      tabletPort: 8089,
    },
  });

  try {
    assert.ok(ingressApp);

    // Direct LAN peer must be rejected on the Ingress listener even with spoofed headers.
    const directAttempt = await ingressApp.inject({
      method: 'GET',
      url: '/api/manage/auth/session',
      remoteAddress: '192.168.1.50',
      headers: { 'x-remote-user-id': 'admin' },
    });
    assert.equal(directAttempt.statusCode, 403);

    // Requests from Supervisor proxy are trusted without EverDash OAuth cookies.
    const ingressSession = await ingressApp.inject({
      method: 'GET',
      url: '/api/manage/auth/session',
      remoteAddress: '172.30.32.2',
      headers: { host: 'homeassistant.local:8123' },
    });
    assert.equal(ingressSession.statusCode, 200);
    assert.deepEqual(ingressSession.json(), {
      authenticated: true,
      connection: 'connected',
      connectionMode: 'supervisor',
      ingress: true,
      tabletPort: 8089,
    });

    // Ingress root serves the Admin builder, not the tablet app or tablet API routes.
    const rootPage = await ingressApp.inject({
      method: 'GET',
      url: '/',
      remoteAddress: '172.30.32.2',
    });
    assert.equal(rootPage.statusCode, 200);
    assert.match(rootPage.body, /Admin/);
    assert.equal(
      (
        await ingressApp.inject({
          method: 'GET',
          url: '/api/bootstrap',
          remoteAddress: '172.30.32.2',
        })
      ).statusCode,
      404,
    );

    // Entity picker and config save work immediately via SUPERVISOR_TOKEN and forwarded HTTPS origin.
    const entities = await ingressApp.inject({
      method: 'GET',
      url: '/api/manage/entities',
      remoteAddress: '172.30.32.2',
    });
    assert.equal(entities.statusCode, 200);
    assert.equal(entities.json().entities[0].entityId, 'light.living_room');
    assert.equal(seenTokens.at(-1), 'Bearer supervisor-secret-token');

    const currentConfig = await ingressApp.inject({
      method: 'GET',
      url: '/api/manage/config',
      remoteAddress: '172.30.32.2',
    });
    assert.equal(currentConfig.statusCode, 200);
    const baseRevision = currentConfig.json().revision as string;

    const badOriginSave = await ingressApp.inject({
      method: 'PUT',
      url: '/api/manage/config',
      remoteAddress: '172.30.32.2',
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'ben.sprytnydom.xyz',
        origin: 'https://attacker.example',
        'x-everdash-request': '1',
      },
      payload: {
        baseRevision,
        config: {
          schemaVersion: 1,
          views: [
            {
              id: 'home',
              title: 'Home',
              cards: [{ type: 'light', entity: 'light.living_room' }],
              badges: [],
            },
          ],
        },
      },
    });
    assert.equal(badOriginSave.statusCode, 403);

    const saved = await ingressApp.inject({
      method: 'PUT',
      url: '/api/manage/config',
      remoteAddress: '172.30.32.2',
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'ben.sprytnydom.xyz',
        origin: 'https://ben.sprytnydom.xyz',
        'x-everdash-request': '1',
      },
      payload: {
        baseRevision,
        config: {
          schemaVersion: 1,
          views: [
            {
              id: 'home',
              title: 'Home',
              cards: [{ type: 'light', entity: 'light.living_room' }],
              badges: [],
            },
          ],
        },
      },
    });
    assert.equal(saved.statusCode, 200);

    // Direct LAN server still requires admin login for management routes...
    assert.equal((await app.inject('/api/manage/auth/session')).json().authenticated, false);
    assert.equal((await app.inject('/api/manage/config')).statusCode, 401);

    // ...while registered tablets on the direct server talk to HA via SUPERVISOR_TOKEN 24/7.
    const code = tabletAccess.overview().registrationCode;
    const registered = await app.inject({
      method: 'POST',
      url: '/api/access/register',
      headers: { origin: 'http://localhost', 'x-everdash-request': '1' },
      payload: { code },
    });
    assert.equal(registered.statusCode, 200);
    const tabletCookie = String(registered.headers['set-cookie']).split(';')[0]!;
    const states = await app.inject({
      method: 'GET',
      url: '/api/ha/states',
      headers: { cookie: tabletCookie },
    });
    assert.equal(states.statusCode, 200);
    assert.equal(states.json()[0].entity_id, 'light.living_room');
  } finally {
    await Promise.all([app.close(), ingressApp?.close()]);
    await new Promise<void>((resolve) => {
      haMock.close(() => resolve());
    });
    await rm(directory, { recursive: true, force: true });
  }
});
