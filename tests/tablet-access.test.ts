import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  parseLinuxIpNeigh,
  parseLinuxProcArp,
  parseMacArp,
  parseMacNdp,
  resolveIpv4FromNeighbors,
} from '../apps/server/src/auth/neighbor-ip';
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

test('resolves IPv6 link-local clients to their internal IPv4 address via neighbor tables', async () => {
  const linuxEntries = [
    ...parseLinuxIpNeigh(
      [
        'fe80::1c8d:6abf:ee1b:452 dev end0 lladdr d8:bb:2c:11:22:33 REACHABLE',
        'fe80::dead:beef dev end0 FAILED',
      ].join('\n'),
    ),
    ...parseLinuxProcArp(
      [
        'IP address       HW type     Flags       HW address            Mask     Device',
        '192.168.1.8      0x1         0x2         d8:bb:2c:11:22:33     *        end0',
        '169.254.10.2     0x1         0x2         d8:bb:2c:11:22:33     *        end0',
      ].join('\n'),
    ),
  ];
  assert.equal(
    resolveIpv4FromNeighbors('fe80::1c8d:6abf:ee1b:0452%end0', linuxEntries),
    '192.168.1.8',
  );

  const macEntries = [
    ...parseMacNdp(
      [
        'Neighbor                                Linklayer Address  Netif Expire    St Flgs Prbs',
        'fe80::860:db68:9f50:a236%en0            2:0:0:0:0:aa          en0 permanent R',
        'fe80::1%lo0                             (incomplete)         lo0 permanent R',
      ].join('\n'),
    ),
    ...parseMacArp('? (192.168.1.22) at 02:00:00:00:00:aa on en0 ifscope [ethernet]'),
  ];
  assert.equal(
    resolveIpv4FromNeighbors('fe80::860:db68:9f50:a236%en0', macEntries),
    '192.168.1.22',
  );

  const directory = await mkdtemp(join(tmpdir(), 'everdash-devices-ipv4-'));
  try {
    let resolvedMap: Record<string, string> = {};
    const access = await TabletAccess.open(directory, {
      resolveIpv4: (ip) => resolvedMap[ip] ?? null,
    });
    const code = access.overview().registrationCode;
    const registered = access.registerDevice(code, {
      ip: 'fe80::1c8d:6abf:ee1b:452%end0',
      deviceType: 'iPad',
      screenSize: '768x1024',
    });
    assert.ok(registered);
    assert.equal(registered.device.ip, 'Unknown');
    assert.equal(access.overview().devices[0]?.ip, 'Unknown');

    // Once the host learns the IPv4 neighbor entry, overview upgrades the IP without exposing IPv6.
    resolvedMap = { 'fe80::1c8d:6abf:ee1b:452%end0': '192.168.1.8' };
    assert.equal(access.overview().devices[0]?.ip, '192.168.1.8');

    // A later IPv6 request without a neighbor match must not clobber the known IPv4.
    resolvedMap = {};
    access.touchSession(registered.session, 'fe80::1c8d:6abf:ee1b:452%end0');
    assert.equal(access.overview().devices[0]?.ip, '192.168.1.8');
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
