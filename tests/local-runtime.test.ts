import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { createLocalManagementAuthorizer } from '../server/auth/local';
import { readLocalRuntimeConfig } from '../server/http/local';
import { createEverDashApps } from '../server/main';

function authorizeLocalPeer(remoteAddress: string, headers: Record<string, string>) {
  return createLocalManagementAuthorizer({
    headers,
    raw: { socket: { remoteAddress } },
  } as never);
}

test('requires an HA origin and token without including credentials in validation errors', () => {
  assert.throws(() => readLocalRuntimeConfig({}), /EVERDASH_HA_URL/);
  assert.throws(
    () => readLocalRuntimeConfig({ EVERDASH_HA_URL: 'http://127.0.0.1:8123' }),
    /EVERDASH_HA_TOKEN/,
  );
  assert.throws(
    () =>
      readLocalRuntimeConfig({
        EVERDASH_HA_URL: 'http://127.0.0.1:8123',
        EVERDASH_HA_TOKEN: 'replace-with-local-home-assistant-token',
      }),
    /Replace the token placeholder/,
  );
  let errorMessage = '';
  try {
    readLocalRuntimeConfig({
      EVERDASH_HA_URL: 'http://user:password@homeassistant.local/api',
      EVERDASH_HA_TOKEN: 'sensitive-local-token',
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : '';
  }
  assert.match(errorMessage, /valid Home Assistant URL/);
  assert.equal(errorMessage.includes('sensitive-local-token'), false);
});

test('rejects unsafe LAN host overrides and never enables local mode implicitly', async () => {
  assert.throws(
    () =>
      readLocalRuntimeConfig({
        EVERDASH_HA_URL: 'http://127.0.0.1:8123',
        EVERDASH_HA_TOKEN: 'fixture-secret',
        EVERDASH_LAN_HOST: 'http://attacker.example',
      }),
    /EVERDASH_LAN_HOST/,
  );
  await assert.rejects(
    createEverDashApps({ supervisorToken: '', logger: false }),
    /SUPERVISOR_TOKEN is required/,
  );
});

test('normalizes a local HA origin and keeps local credentials in the server runtime', () => {
  assert.deepEqual(
    readLocalRuntimeConfig({
      EVERDASH_HA_URL: 'http://homeassistant.local:8123/',
      EVERDASH_HA_TOKEN: 'sensitive-local-token',
      EVERDASH_LAN_HOST: 'everdash.local',
      EVERDASH_DATA_DIR: '.local/test-data',
    }),
    {
      haOrigin: 'http://homeassistant.local:8123',
      haToken: 'sensitive-local-token',
      hostOverride: 'everdash.local',
      dataDirectory: resolve('.local/test-data'),
    },
  );
});

test('local management authorization trusts only loopback socket peers', () => {
  const spoofedIdentity = {
    'x-remote-user-id': 'home-admin',
    'x-forwarded-for': '127.0.0.1',
  };

  assert.equal(authorizeLocalPeer('127.0.0.1', {}), true);
  assert.equal(authorizeLocalPeer('::1', {}), true);
  assert.equal(authorizeLocalPeer('::ffff:127.0.0.1', {}), true);
  assert.equal(authorizeLocalPeer('192.168.1.9', spoofedIdentity), false);
});

test('local admin routes use loopback auth while tablet listeners cannot access admin routes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-local-runtime-'));
  const apps = await createEverDashApps({
    dataDirectory: directory,
    localHomeAssistant: {
      origin: 'http://127.0.0.1:8123',
      token: 'fixture-local-token',
      hostOverride: '127.0.0.1',
    },
    localNetworkInterfaces: { lo0: [] },
    logger: false,
  });

  try {
    const management = await apps.management.inject({ method: 'GET', url: '/api/manage/devices' });
    assert.equal(management.statusCode, 200);

    const direct = await apps.directHttp.inject({ method: 'GET', url: '/api/manage/devices' });
    assert.equal(direct.statusCode, 403);
  } finally {
    await Promise.all([apps.management.close(), apps.direct.close(), apps.directHttp.close()]);
    await rm(directory, { recursive: true, force: true });
  }
});
