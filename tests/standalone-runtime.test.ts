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
      ['POST', '/api/manage/config/validate'],
      ['POST', '/api/manage/preview'],
      ['PUT', '/api/manage/config'],
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
      assert.equal(response.statusCode, url.includes('/devices') ? 404 : 401, `${method} ${url}`);
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

test('imported dashboards require an explicit access choice', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-import-'));
  await writeFile(join(directory, 'dashboard.json'), '{}');
  const { app } = await createStandaloneApp({ dataDirectory: directory, logger: false });
  try {
    assert.equal((await app.inject('/api/access')).json().status, 'setup_required');
    assert.equal((await app.inject('/api/ha/states')).statusCode, 401);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('PIN unlock issues a session cookie and lock clears it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-unlock-'));
  const { app, tabletAccess } = await createStandaloneApp({
    dataDirectory: directory,
    logger: false,
  });
  try {
    await tabletAccess.setPin('0012');
    const headers = { origin: 'http://localhost', 'x-everdash-request': '1' };
    const unlocked = await app.inject({
      method: 'POST',
      url: '/api/access/unlock',
      headers,
      payload: { pin: '0012' },
    });
    assert.equal(unlocked.statusCode, 200);
    assert.match(String(unlocked.headers['set-cookie']), /HttpOnly/);

    // The issued session must be accepted on the next requests, or the tablet stays on the PIN gate.
    const session = /everdash_tablet=([^;]+)/.exec(String(unlocked.headers['set-cookie']))?.[1];
    assert.ok(session);
    const cookie = `everdash_tablet=${session}`;
    const status = await app.inject({ method: 'GET', url: '/api/access', headers: { cookie } });
    assert.deepEqual(status.json(), { status: 'unlocked' });
    const bootstrap = await app.inject({
      method: 'GET',
      url: '/api/bootstrap',
      headers: { cookie },
    });
    assert.notEqual(bootstrap.statusCode, 401);

    const locked = await app.inject({ method: 'POST', url: '/api/access/lock', headers });
    assert.equal(locked.statusCode, 200);
    assert.match(String(locked.headers['set-cookie']), /Max-Age=0/);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
