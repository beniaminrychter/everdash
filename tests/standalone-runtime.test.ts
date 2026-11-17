import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStandaloneApp } from '../apps/server/src/standalone';

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
    assert.equal(tabletAccess.overview().devices.length, 0);
    assert.equal(
      (await app.inject({ method: 'GET', url: '/api/access', headers: { cookie } })).json().status,
      'registration_required',
    );
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
