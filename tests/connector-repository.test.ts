import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { parseHomeAssistantOrigin } from '../apps/server/src/auth/origin';
import { ConnectorRepository } from '../apps/server/src/auth/connector-repository';

const credential = {
  origin: 'http://192.168.1.10:8123/',
  refreshToken: 'dummy-secret',
  clientId: 'HTTP://example.test:80/callback?original=yes',
};

test('origin parser accepts LAN, localhost and IPv6 and rejects URL components', () => {
  assert.equal(parseHomeAssistantOrigin('http://192.168.1.10:8123/'), 'http://192.168.1.10:8123');
  assert.equal(parseHomeAssistantOrigin('http://localhost:8123'), 'http://localhost:8123');
  assert.equal(parseHomeAssistantOrigin('https://[::1]:444/'), 'https://[::1]:444');
  for (const value of [
    'ftp://host',
    'http://user:pass@host',
    'http://host/path',
    'http://host?',
    'http://host#',
    'not a url',
    'http://host/../',
    'http://host\\path',
  ]) {
    assert.throws(() => parseHomeAssistantOrigin(value), undefined, value);
  }
});

test('connector persists secrets restrictively and replacement advances generation', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'connector-test-'));
  try {
    const repo = new ConnectorRepository({ directory });
    assert.deepEqual(repo.status(), { state: 'unconfigured' });
    const first = await repo.install(credential);
    assert.equal(first.origin, 'http://192.168.1.10:8123');
    assert.equal(statSync(directory).mode & 0o777, 0o700);
    assert.equal(statSync(join(directory, 'connector.json')).mode & 0o777, 0o600);
    const reopened = new ConnectorRepository({ directory });
    assert.equal(reopened.readCredentials()?.clientId, credential.clientId);
    assert.equal(reopened.readCredentials()?.refreshToken, credential.refreshToken);
    assert.equal(JSON.stringify(reopened.status()).includes('dummy-secret'), false);
    await assert.rejects(reopened.install(credential));
    const next = await reopened.install(
      { ...credential, refreshToken: 'dummy-next' },
      { replace: true },
    );
    assert.notEqual(next.generation, first.generation);
    await assert.rejects(
      reopened.install({ ...credential, origin: 'http://other' }, { replace: true }),
    );
    assert.equal(reopened.readCredentials()?.refreshToken, 'dummy-next');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('concurrent initial installs pin the first origin', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'connector-test-'));
  try {
    const repo = new ConnectorRepository({ directory });
    const results = await Promise.allSettled([
      repo.install(credential),
      repo.install({ ...credential, origin: 'http://other' }),
    ]);
    assert.equal(results[0].status, 'fulfilled');
    assert.equal(results[1].status, 'rejected');
    assert.equal(repo.readCredentials()?.origin, 'http://192.168.1.10:8123');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('failed durable replacement preserves existing connector', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'connector-test-'));
  let fail = false;
  try {
    const repo = new ConnectorRepository({
      directory,
      beforeRename: () => {
        if (fail) {
          throw new Error('injected');
        }
      },
    });
    const first = await repo.install(credential);
    fail = true;
    await assert.rejects(
      repo.install({ ...credential, refreshToken: 'dummy-next' }, { replace: true }),
    );
    assert.equal(repo.readCredentials()?.generation, first.generation);
    assert.equal(
      new ConnectorRepository({ directory }).readCredentials()?.refreshToken,
      'dummy-secret',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('corrupt connector fails closed with secret-safe diagnostic', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'connector-test-'));
  try {
    writeFileSync(join(directory, 'connector.json'), '{"refreshToken":"dummy-secret"');
    const repo = new ConnectorRepository({ directory });
    assert.deepEqual(repo.status(), { state: 'repair-required' });
    assert.equal(repo.readCredentials(), null);
    await assert.rejects(repo.install(credential));
    assert.equal(
      readFileSync(join(directory, 'connector.json'), 'utf8'),
      '{"refreshToken":"dummy-secret"',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('post-rename sync failure reports installed grant with uncertain durability', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'connector-test-'));
  let fail = false;
  try {
    const repo = new ConnectorRepository({
      directory,
      beforeDirectorySync: () => {
        if (fail) {
          throw new Error('dummy-sensitive-error');
        }
      },
    });
    const first = await repo.install(credential);
    assert.equal(first.durability, 'confirmed');
    fail = true;
    const installed = await repo.install(
      { ...credential, refreshToken: 'dummy-next' },
      { replace: true },
    );
    assert.equal(installed.durability, 'uncertain');
    assert.notEqual(installed.generation, first.generation);
    assert.equal(repo.readCredentials()?.generation, installed.generation);
    const restarted = new ConnectorRepository({ directory });
    assert.equal(restarted.readCredentials()?.generation, installed.generation);
    assert.equal(restarted.readCredentials()?.refreshToken, 'dummy-next');
    assert.equal(JSON.stringify(repo.status()).includes('dummy-sensitive-error'), false);
    assert.deepEqual(repo.status(), {
      state: 'connected',
      origin: installed.origin,
      generation: installed.generation,
      durability: 'uncertain',
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
