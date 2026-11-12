import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ConnectorRepository } from '../apps/server/src/auth/connector-repository';
import { HouseholdCredentialProvider } from '../apps/server/src/auth/credential-provider';
import { createHomeAssistantClient } from '../apps/server/src/home-assistant/client';

const grant = (accessToken: string) => ({ accessToken, expiresIn: 100, refreshToken: 'refresh' });

test('caches, refreshes at expiry, collapses concurrent requests and retains exact client id across restart', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'credential-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repository = new ConnectorRepository({ directory });
  await repository.install({
    origin: 'http://localhost:8123',
    refreshToken: 'refresh',
    clientId: 'http://localhost:8123/exact/',
  });
  let now = 0;
  const seen: string[] = [];
  const refresh = async (_origin: string, clientId: string) => {
    seen.push(clientId);
    return grant(`token-${seen.length}`);
  };
  const provider = new HouseholdCredentialProvider({ repository, refresh, now: () => now });
  const [a, b] = await Promise.all([provider.get(), provider.get()]);
  assert.equal(a.accessToken, 'token-1');
  assert.equal(b.accessToken, 'token-1');
  now = 96_000;
  assert.equal((await provider.get()).accessToken, 'token-2');
  const restarted = new HouseholdCredentialProvider({
    repository: new ConnectorRepository({ directory }),
    refresh,
  });
  assert.equal((await restarted.get()).accessToken, 'token-3');
  assert.deepEqual(seen, [
    'http://localhost:8123/exact/',
    'http://localhost:8123/exact/',
    'http://localhost:8123/exact/',
  ]);
});

test('discards late refresh results after reconnect and exposes offline-safe status', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'credential-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repository = new ConnectorRepository({ directory });
  await repository.install({
    origin: 'http://localhost:8123',
    refreshToken: 'refresh',
    clientId: 'client',
  });
  let resolve!: (value: ReturnType<typeof grant>) => void;
  const provider = new HouseholdCredentialProvider({
    repository,
    refresh: async () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  const pending = provider.get();
  await repository.install(
    { origin: 'http://localhost:8123', refreshToken: 'new', clientId: 'client' },
    { replace: true },
  );
  resolve(grant('stale'));
  await assert.rejects(pending);
  assert.equal(provider.status().state, 'connected');
});

test('retries an explicit 401 once for controls and collapses simultaneous failures', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'credential-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repository = new ConnectorRepository({ directory });
  await repository.install({
    origin: 'http://localhost:8123',
    refreshToken: 'refresh',
    clientId: 'client',
  });
  let refreshes = 0;
  const provider = new HouseholdCredentialProvider({
    repository,
    refresh: async () => grant(`token-${++refreshes}`),
  });
  const calls: string[] = [];
  const client = createHomeAssistantClient({
    provider,
    request: async (_url, init) => {
      const token = new Headers(init?.headers).get('authorization') ?? '';
      calls.push(token);
      return token === 'Bearer token-1'
        ? new Response('', { status: 401 })
        : Response.json({ ok: true });
    },
  });
  await Promise.all([client.getStates(), client.callService('weather', 'get_forecasts', {})]);
  assert.equal(refreshes, 2);
  assert.deepEqual(calls.sort(), [
    'Bearer token-1',
    'Bearer token-1',
    'Bearer token-2',
    'Bearer token-2',
  ]);
});

test('stops after a second 401 and does not retry ambiguous control failures', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'credential-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repository = new ConnectorRepository({ directory });
  await repository.install({
    origin: 'http://localhost:8123',
    refreshToken: 'refresh',
    clientId: 'client',
  });
  for (const failure of ['401', '403', 'timeout', 'network', 'abort', 'malformed', 'oversized']) {
    let calls = 0;
    const provider = new HouseholdCredentialProvider({
      repository,
      refresh: async () => grant('token'),
    });
    const client = createHomeAssistantClient({
      provider,
      request: async () => {
        calls += 1;
        if (failure === 'timeout' || failure === 'network' || failure === 'abort') {
          const error = new Error('fixture');
          error.name =
            failure === 'timeout' ? 'TimeoutError' : failure === 'abort' ? 'AbortError' : 'Error';
          throw error;
        }
        if (failure === 'malformed') {
          return new Response('invalid');
        }
        if (failure === 'oversized') {
          return new Response('x', { headers: { 'content-length': '3000000' } });
        }
        return new Response('', { status: Number(failure) });
      },
    });
    await assert.rejects(
      client.callService('light', 'turn_on', {}),
      failure === '401' ? { code: 'HA_CREDENTIAL_REPAIR' } : undefined,
    );
    assert.equal(calls, failure === '401' ? 2 : 1, failure);
  }
});

test('does not send a request cancelled while refresh is pending', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'credential-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repository = new ConnectorRepository({ directory });
  await repository.install({
    origin: 'http://localhost:8123',
    refreshToken: 'refresh',
    clientId: 'client',
  });
  let resolve!: (value: ReturnType<typeof grant>) => void;
  const provider = new HouseholdCredentialProvider({
    repository,
    refresh: async () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  let calls = 0;
  const client = createHomeAssistantClient({
    provider,
    request: async () => {
      calls += 1;
      return Response.json({});
    },
  });
  const controller = new AbortController();
  const pending = client.getStates(controller.signal);
  const other = client.getStates();
  controller.abort();
  resolve(grant('token'));
  await assert.rejects(pending);
  await other;
  assert.equal(calls, 1);
});

test('a late 401 cannot invalidate a newer refresh that returns the same token text', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'credential-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repository = new ConnectorRepository({ directory });
  await repository.install({
    origin: 'http://localhost:8123',
    refreshToken: 'refresh',
    clientId: 'client',
  });
  let refreshes = 0;
  const provider = new HouseholdCredentialProvider({
    repository,
    refresh: async () => {
      refreshes += 1;
      return grant('same');
    },
  });
  const old = await provider.get();
  provider.invalidate(old);
  await provider.get();
  provider.invalidate(old);
  await provider.get();
  assert.equal(refreshes, 2);
});

test('discards an in-flight control response after reconnect without repeating the command', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'credential-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repository = new ConnectorRepository({ directory });
  await repository.install({
    origin: 'http://localhost:8123',
    refreshToken: 'refresh',
    clientId: 'client',
  });
  const provider = new HouseholdCredentialProvider({
    repository,
    refresh: async () => grant('token'),
  });
  let resolve!: (response: Response) => void;
  let calls = 0;
  const client = createHomeAssistantClient({
    provider,
    request: async () => {
      calls += 1;
      return new Promise((done) => {
        resolve = done;
      });
    },
  });
  const pending = client.callService('light', 'turn_on', {});
  await new Promise((done) => setImmediate(done));
  await repository.install(
    { origin: 'http://localhost:8123', refreshToken: 'new', clientId: 'client' },
    { replace: true },
  );
  resolve(Response.json({ ok: true }));
  await assert.rejects(pending, { code: 'HA_CREDENTIAL_REPAIR' });
  assert.equal(calls, 1);
});
