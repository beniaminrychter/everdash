import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { getIngressUserId } from '../server/auth/ingress';
import { PairingService } from '../server/auth/pairing';
import { DeviceRepository } from '../server/auth/devices';
import { DeviceSessions } from '../server/auth/sessions';
import { SlidingWindowRateLimiter } from '../server/auth/rate-limit';

async function withRepository(
  run: (directory: string, repository: DeviceRepository) => Promise<void>,
  now?: () => number,
) {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-pairing-'));
  const repository = new DeviceRepository({ directory, now });
  try {
    await run(directory, repository);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('management identity requires the trusted socket peer and a nonempty Ingress user ID', () => {
  assert.equal(
    getIngressUserId({
      socket: { remoteAddress: '172.30.32.2' },
      headers: { 'x-remote-user-id': 'ha-user-1' },
    }),
    'ha-user-1',
  );
  assert.equal(
    getIngressUserId({
      socket: { remoteAddress: '::ffff:172.30.32.2' },
      headers: { 'x-remote-user-id': 'ha-user-1' },
    }),
    'ha-user-1',
  );
  assert.equal(
    getIngressUserId({
      socket: { remoteAddress: '192.168.1.5' },
      headers: { 'x-remote-user-id': 'ha-user-1' },
    }),
    null,
  );
  assert.equal(
    getIngressUserId({
      socket: { remoteAddress: '172.30.32.2' },
      headers: { 'x-remote-user-id': '  ' },
    }),
    null,
  );
});

test('pairing requires the independent poll secret and issues a one-time opaque session', async () => {
  let now = 1_800_000_000_000;
  await withRepository(
    async (_directory, devices) => {
      const pairing = new PairingService({ devices, now: () => now });
      const request = pairing.create('192.168.1.20');
      assert.match(request.code, /^[A-HJ-NP-Z2-9]{8}$/);
      assert.equal(request.expiresAt, now + 300_000);
      assert.equal(JSON.stringify(pairing).includes(request.code), false);
      await assert.rejects(pairing.status(request.requestId, 'wrong-secret'), {
        code: 'PAIRING_POLL_DENIED',
      });
      await pairing.approve('ha-user-1', request.code, 'Kitchen iPad');
      const approved = await pairing.status(request.requestId, request.pollSecret);
      assert.equal(approved.status, 'approved');
      if (approved.status !== 'approved') {
        return;
      }
      assert.match(approved.session, /^[A-Za-z0-9_-]{43}$/);
      assert.equal(await devices.authorize(approved.session), true);
      assert.deepEqual(await devices.list(), [
        {
          id: approved.deviceId,
          label: 'Kitchen iPad',
          createdAt: now,
          expiresAt: now + 365 * 24 * 60 * 60 * 1000,
          revokedAt: null,
        },
      ]);
      now += 1;
    },
    () => now,
  );
});

test('pairing requests expire after five minutes and cannot be approved afterward', async () => {
  await withRepository(async (_directory, devices) => {
    let now = 1_800_000_000_000;
    const pairing = new PairingService({ devices, now: () => now });
    const request = pairing.create('tablet-ip');
    now += 300_001;
    assert.deepEqual(await pairing.status(request.requestId, request.pollSecret), {
      status: 'expired',
    });
    await assert.rejects(pairing.approve('ha-user-1', request.code, 'Old tablet'), {
      code: 'PAIRING_NOT_FOUND',
    });
  });
});

test('redemption is one-time; requests do not survive restart, but devices do', async () => {
  await withRepository(async (directory, devices) => {
    const pairing = new PairingService({ devices });
    const request = pairing.create('tablet-ip');
    await pairing.approve('ha-user-1', request.code, 'Hall iPad');
    const approved = await pairing.status(request.requestId, request.pollSecret);
    assert.equal(approved.status, 'approved');
    if (approved.status !== 'approved') {
      return;
    }
    await assert.rejects(pairing.status(request.requestId, request.pollSecret), {
      code: 'PAIRING_REDEEMED',
    });
    const restartedDevices = new DeviceRepository({ directory });
    assert.equal(await restartedDevices.authorize(approved.session), true);
    assert.deepEqual(
      await new PairingService({ devices: restartedDevices }).status(
        request.requestId,
        request.pollSecret,
      ),
      { status: 'expired' },
    );
  });
});

test('revocation immediately blocks sessions and logout revokes only its matching session', async () => {
  await withRepository(async (_directory, devices) => {
    const pairing = new PairingService({ devices });
    const request = pairing.create('tablet-ip');
    await pairing.approve('ha-user-1', request.code, 'Office iPad');
    const approved = await pairing.status(request.requestId, request.pollSecret);
    assert.equal(approved.status, 'approved');
    if (approved.status !== 'approved') {
      return;
    }
    const sessions = new DeviceSessions(devices);
    assert.equal(await sessions.authorize(approved.session), true);
    assert.equal(await sessions.logout('invalid-session'), false);
    assert.equal(await sessions.logout(approved.session), true);
    assert.equal(await sessions.authorize(approved.session), false);
    assert.equal(await devices.revoke(approved.deviceId), false);
    assert.equal((await devices.list())[0].revokedAt !== null, true);
  });
});

test('device persistence stores only a digest with private file permissions and expires sessions', async () => {
  let now = 1_800_000_000_000;
  const directory = await mkdtemp(join(tmpdir(), 'everdash-device-expiry-'));
  try {
    const devices = new DeviceRepository({ directory, now: () => now });
    const session = 'opaque-session-for-test-only';
    const device = await devices.add('Tablet', session);
    const source = await readFile(join(directory, 'devices.json'), 'utf8');
    const fileStat = await stat(join(directory, 'devices.json'));
    assert.equal(source.includes(session), false);
    assert.equal((fileStat.mode & 0o777).toString(8), '600');
    assert.equal(await devices.authorize(session), true);
    now = device.expiresAt;
    assert.equal(await devices.authorize(session), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('creation, approval and polling rate limits use separate identities and windows', () => {
  let now = 1_800_000_000_000;
  const limiter = new SlidingWindowRateLimiter({ now: () => now });
  for (let index = 0; index < 5; index += 1) {
    assert.equal(limiter.consume('create:tablet-ip', 5, 60_000).allowed, true);
  }
  const limited = limiter.consume('create:tablet-ip', 5, 60_000);
  assert.equal(limited.allowed, false);
  assert.ok(limited.retryAfterSeconds > 0);
  assert.equal(limiter.consume('create:another-tablet', 5, 60_000).allowed, true);
  now += 60_001;
  assert.equal(limiter.consume('create:tablet-ip', 5, 60_000).allowed, true);
});

test('outstanding pairing requests are capped', async () => {
  await withRepository(async (_directory, devices) => {
    const pairing = new PairingService({ devices, maxPending: 2 });
    pairing.create('one');
    pairing.create('two');
    assert.throws(() => pairing.create('three'), { code: 'PAIRING_CAPACITY' });
  });
});
