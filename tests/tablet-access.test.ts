import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { TabletAccess } from '../apps/server/src/auth/tablet-access';

test('PIN sessions survive restart and are invalidated on change', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-pin-'));
  try {
    const access = await TabletAccess.open(directory);
    assert.equal(access.status(), 'open');
    await access.setPin('0012');
    assert.equal(await access.unlock('12'), null);
    const session = await access.unlock('0012');
    assert.ok(session);
    assert.equal((await TabletAccess.open(directory)).authorized(session), true);
    await access.setPin('4321');
    assert.equal(access.authorized(session), false);
    await access.setPin(null);
    assert.equal(access.status(), 'open');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('invalid PINs cannot change policy and pending unlock cannot cross a policy change', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-pin-race-'));
  try {
    const access = await TabletAccess.open(directory);
    for (const pin of ['123', '1234567', '１２３４', '12ab', ' 1234']) {
      await assert.rejects(access.setPin(pin));
    }
    assert.equal(access.status(), 'open');
    await access.setPin('1234');
    const pending = access.unlock('1234');
    await access.setPin(null);
    assert.equal(await pending, null);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
