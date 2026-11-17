import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { TabletAccess } from '../apps/server/src/auth/tablet-access';

test('single-use registration codes register devices, regenerate immediately, and survive restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-devices-'));
  try {
    const access = await TabletAccess.open(directory);
    assert.equal(access.status(), 'registration_required');
    const firstOverview = access.overview();
    assert.match(firstOverview.registrationCode, /^[0-9]{6}$/);
    assert.equal(firstOverview.devices.length, 0);

    // Invalid codes are rejected without altering state.
    assert.equal(access.registerDevice('12'), null);
    const wrongCode = firstOverview.registrationCode === '000000' ? '000001' : '000000';
    assert.equal(access.registerDevice(wrongCode), null);

    const registered = access.registerDevice(firstOverview.registrationCode, {
      ip: '::ffff:192.168.1.42',
      deviceType: 'iPad',
      screenSize: '768x1024',
    });
    assert.ok(registered);
    assert.equal(registered.device.ip, '192.168.1.42');
    assert.equal(registered.device.deviceType, 'iPad');
    assert.equal(registered.device.screenSize, '768 × 1024');
    assert.equal(registered.device.name, '');
    assert.equal(access.authorized(registered.session), true);

    // Code was single-use and automatically regenerated.
    const nextOverview = access.overview();
    assert.notEqual(nextOverview.registrationCode, firstOverview.registrationCode);
    assert.match(nextOverview.registrationCode, /^[0-9]{6}$/);
    assert.equal(access.registerDevice(firstOverview.registrationCode), null);

    // Reloading from disk keeps the registered device and its session valid.
    const reopened = await TabletAccess.open(directory);
    assert.equal(reopened.authorized(registered.session), true);
    assert.equal(reopened.overview().devices.length, 1);
    assert.equal(reopened.overview().registrationCode, nextOverview.registrationCode);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('devices can be renamed, updated on reconnect, and removed to revoke access', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-devices-manage-'));
  try {
    const access = await TabletAccess.open(directory);
    const code1 = access.overview().registrationCode;
    const manual = access.regenerateCode();
    assert.notEqual(manual.registrationCode, code1);
    assert.equal(access.registerDevice(code1), null);

    const registered = access.registerDevice(manual.registrationCode, {
      ip: '192.168.1.50',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 12_5_7 like Mac OS X)',
      screenSize: '1024 × 768',
    });
    assert.ok(registered);
    assert.equal(registered.device.deviceType, 'iPad');

    const renamed = access.renameDevice(registered.device.id, '  Kitchen   iPad  ');
    assert.ok(renamed);
    assert.equal(renamed.name, 'Kitchen iPad');
    assert.equal((await TabletAccess.open(directory)).overview().devices[0]?.name, 'Kitchen iPad');

    access.touchSession(registered.session, '::ffff:192.168.1.99');
    assert.equal(access.overview().devices[0]?.ip, '192.168.1.99');

    assert.equal(access.removeDevice(registered.device.id), true);
    assert.equal(access.removeDevice(registered.device.id), false);
    assert.equal(access.authorized(registered.session), false);
    assert.equal(access.overview().devices.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('migrates legacy v1 tablet-access.json to device registration', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-devices-migrate-'));
  try {
    await writeFile(
      join(directory, 'tablet-access.json'),
      JSON.stringify({
        key: 'a'.repeat(64),
        generation: 2,
        salt: null,
        hash: null,
        unresolved: false,
      }),
    );
    const access = await TabletAccess.open(directory);
    assert.equal(access.status(), 'registration_required');
    assert.match(access.overview().registrationCode, /^[0-9]{6}$/);
    assert.equal(access.overview().devices.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
