import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { ConnectorRepository } from '../apps/server/src/auth/connector-repository';
import { HouseholdCredentialProvider } from '../apps/server/src/auth/credential-provider';
import { AdminSessions } from '../apps/server/src/auth/admin-sessions';
import { OAuthCoordinator } from '../apps/server/src/auth/oauth-coordinator';

const browser = 'http://192.168.1.2:8124';
const ha = 'http://192.168.1.3:8123';
function fixture(options: { beforeRename?: () => void; beforeDirectorySync?: () => void } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'oauth-flow-'));
  const repository = new ConnectorRepository({ directory, ...options });
  const provider = new HouseholdCredentialProvider({ repository });
  const sessions = new AdminSessions();
  const revoked: string[] = [];
  const exchanged: string[] = [];
  let admin = true;
  let reachable = true;
  const flow = new OAuthCoordinator({
    repository,
    provider,
    sessions,
    probe: async () => {
      if (!reachable) {
        throw new Error('unreachable');
      }
    },
    exchange: async (_origin, clientId, code) => {
      exchanged.push(clientId);
      if (code === 'fail') {
        throw new Error('secret code');
      }
      return { accessToken: `access-${code}`, refreshToken: `refresh-${code}`, expiresIn: 3600 };
    },
    verify: async () => {
      if (!admin) {
        throw new Error('secret identity');
      }
      return { id: 'admin' };
    },
    revoke: async (_origin, token) => {
      revoked.push(token);
    },
  });
  const begin = (origin = ha, intent: 'login' | 'reconnect' = 'login') => {
    const result = flow.begin({
      browserOrigin: browser,
      homeAssistantOrigin: origin,
      intent,
      secure: false,
    });
    const url = new URL(result.authorizationUrl);
    return {
      state: url.searchParams.get('state')!,
      binding: result.transactionCookie.split(';')[0].split('=')[1],
      url,
    };
  };
  const complete = (tx: ReturnType<typeof begin>, code: string, callbackOrigin = browser) =>
    flow.complete({ state: tx.state, binding: tx.binding, code, callbackOrigin, secure: false });
  return {
    directory,
    repository,
    provider,
    sessions,
    flow,
    revoked,
    exchanged,
    begin,
    complete,
    setAdmin: (value: boolean) => {
      admin = value;
    },
    setReachable: (value: boolean) => {
      reachable = value;
    },
    close: () => rmSync(directory, { recursive: true, force: true }),
  };
}

test('first administrator pins the household and exact browser client ID', async (t) => {
  const f = fixture();
  t.after(f.close);
  const tx = f.begin();
  assert.equal(tx.url.searchParams.get('client_id'), browser);
  assert.equal(tx.url.searchParams.get('redirect_uri'), `${browser}/api/manage/auth/callback`);
  const result = await f.complete(tx, 'first');
  const credentials = f.repository.readCredentials()!;
  assert.equal(credentials.clientId, browser);
  assert.equal(credentials.refreshToken, 'refresh-first');
  assert.equal((await f.provider.get()).accessToken, 'access-first');
  assert.equal(f.flow.readSession(result.session)?.userId, 'admin');
  assert.deepEqual(f.revoked, []);
});

test('rejects invalid callbacks before exchange and cleans up failed identity', async (t) => {
  const f = fixture();
  t.after(f.close);
  const tx = f.begin();
  await assert.rejects(
    f.flow.complete({
      state: tx.state,
      binding: 'wrong',
      code: 'x',
      callbackOrigin: browser,
      secure: false,
    }),
  );
  await assert.rejects(f.complete(tx, 'x', 'http://wrong:8124'));
  await assert.rejects(f.complete(tx, 'x'));
  assert.deepEqual(f.exchanged, []);
  const malformed = f.begin();
  await assert.rejects(f.complete(malformed, ['bad'] as unknown as string));
  assert.deepEqual(f.exchanged, []);
  f.setAdmin(false);
  await assert.rejects(
    f.complete(f.begin(), 'nonadmin'),
    (error: Error) => !error.message.includes('secret'),
  );
  assert.deepEqual(f.revoked, ['refresh-nonadmin']);
  assert.equal(f.repository.status().state, 'unconfigured');
});

test('concurrent first callbacks pin first origin and same-origin login does not replace it', async (t) => {
  const f = fixture();
  t.after(f.close);
  const a = f.begin();
  const b = f.begin();
  const c = f.begin('http://other:8123');
  const outcomes = await Promise.allSettled([
    f.complete(a, 'a'),
    f.complete(b, 'b'),
    f.complete(c, 'c'),
  ]);
  assert.deepEqual(
    outcomes.map((item) => item.status),
    ['fulfilled', 'fulfilled', 'rejected'],
  );
  assert.equal(f.repository.readCredentials()?.refreshToken, 'refresh-a');
  assert.deepEqual(f.revoked.sort(), ['refresh-b', 'refresh-c']);
});

test('reconnect replaces generation, login does not, and logout stays local', async (t) => {
  const f = fixture();
  t.after(f.close);
  const first = await f.complete(f.begin(), 'one');
  const old = f.repository.readCredentials()!;
  await f.complete(f.begin(), 'login');
  assert.equal(f.repository.readCredentials()?.generation, old.generation);
  assert.throws(() => f.begin('http://other:8123', 'reconnect'));
  const next = await f.complete(f.begin(ha, 'reconnect'), 'new');
  const current = f.repository.readCredentials()!;
  assert.notEqual(current.generation, old.generation);
  assert.equal(f.flow.readSession(first.session), null);
  assert.equal(f.sessions.read(next.session, ha, current.generation)?.userId, 'admin');
  f.flow.logout(next.session, false);
  assert.equal(f.flow.readSession(next.session), null);
  assert.equal((await f.provider.get()).accessToken, 'access-new');
  assert.deepEqual(f.revoked, ['refresh-login']);
});

test('failed persistence cleans grant; uncertain committed grant remains current', async (t) => {
  let fail = false;
  const f = fixture({
    beforeRename: () => {
      if (fail) {
        throw new Error('secret disk');
      }
    },
  });
  t.after(f.close);
  await f.complete(f.begin(), 'old');
  const old = f.repository.readCredentials()!;
  fail = true;
  await assert.rejects(
    f.complete(f.begin(ha, 'reconnect'), 'failed'),
    (error: Error) => !error.message.includes('secret'),
  );
  assert.equal(f.repository.readCredentials()?.generation, old.generation);
  assert.deepEqual(f.revoked, ['refresh-failed']);
  let uncertain = false;
  const g = fixture({
    beforeDirectorySync: () => {
      if (uncertain) {
        throw new Error('secret disk');
      }
    },
  });
  t.after(g.close);
  const previous = await g.complete(g.begin(), 'previous');
  uncertain = true;
  const result = await g.complete(g.begin(ha, 'reconnect'), 'uncertain');
  assert.equal(g.flow.readSession(previous.session), null);
  assert.equal(g.flow.readSession(result.session)?.userId, 'admin');
  assert.equal(result.durability, 'uncertain');
  assert.equal(g.repository.readCredentials()?.refreshToken, 'refresh-uncertain');
  assert.equal((await g.provider.get()).accessToken, 'access-uncertain');
  assert.deepEqual(g.revoked, []);
  assert.ok(!JSON.stringify(g.flow.status()).includes('refresh-uncertain'));
});

test('denial, expiry, exchange failure and session failure remain safe', async (t) => {
  let now = 0;
  const f = fixture();
  t.after(f.close);
  const tx = f.begin();
  await assert.rejects(
    f.flow.complete({
      state: tx.state,
      binding: tx.binding,
      error: 'secret description',
      callbackOrigin: browser,
      secure: false,
    }),
    (error: Error) => !error.message.includes('secret'),
  );
  await assert.rejects(
    f.complete(f.begin(), 'fail'),
    (error: Error) => !error.message.includes('secret'),
  );
  assert.equal(f.repository.status().state, 'unconfigured');
  const { OAuthTransactions } = await import('../apps/server/src/auth/admin-state');
  const { AdminSessions } = await import('../apps/server/src/auth/admin-sessions');
  class BrokenSessions extends AdminSessions {
    override issue(identity: Parameters<AdminSessions['issue']>[0]): string {
      super.issue(identity);
      throw new Error('secret session');
    }
  }
  const flow = new OAuthCoordinator({
    repository: f.repository,
    provider: f.provider,
    transactions: new OAuthTransactions({ now: () => now }),
    sessions: new BrokenSessions(),
    probe: async () => {},
    exchange: async () => ({ accessToken: 'access', refreshToken: 'retained', expiresIn: 3600 }),
    verify: async () => ({ id: 'admin' }),
    revoke: async (_origin, token) => {
      f.revoked.push(token);
    },
  });
  const begin = () => {
    const b = flow.begin({
      browserOrigin: browser,
      homeAssistantOrigin: ha,
      intent: 'login',
      secure: false,
    });
    return {
      state: new URL(b.authorizationUrl).searchParams.get('state')!,
      binding: b.transactionCookie.split(';')[0].split('=')[1],
    };
  };
  const expired = begin();
  now = 600_001;
  await assert.rejects(
    flow.complete({ ...expired, code: 'x', callbackOrigin: browser, secure: false }),
  );
  await assert.rejects(
    flow.complete({ ...begin(), code: 'x', callbackOrigin: browser, secure: false }),
    (error: Error) => !error.message.includes('secret'),
  );
  assert.equal(f.repository.readCredentials()?.refreshToken, 'retained');
  assert.deepEqual(f.revoked, []);
});

test('reports unreachable Home Assistant before redirect and after a failed exchange', async (t) => {
  const f = fixture();
  t.after(f.close);
  await f.flow.checkReachable(ha);
  const tx = f.begin();
  f.setReachable(false);
  await assert.rejects(
    f.flow.checkReachable(ha),
    (error: Error & { code?: string }) => error.code === 'HA_UNREACHABLE',
  );
  await assert.rejects(
    f.complete(tx, 'fail'),
    (error: Error & { code?: string }) => error.code === 'HA_UNREACHABLE',
  );
  assert.equal(f.repository.status().state, 'unconfigured');
});

test('nonadmin identity keeps its specific code and revokes the grant', async (t) => {
  const { OAuthFlowError } = await import('../apps/server/src/auth/oauth-flow-error');
  const directory = mkdtempSync(join(tmpdir(), 'oauth-flow-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repository = new ConnectorRepository({ directory });
  const revoked: string[] = [];
  const flow = new OAuthCoordinator({
    repository,
    provider: new HouseholdCredentialProvider({ repository }),
    probe: async () => {},
    exchange: async () => ({ accessToken: 'a', refreshToken: 'r', expiresIn: 3600 }),
    verify: async () => {
      throw new OAuthFlowError('NOT_ADMIN');
    },
    revoke: async (_origin, token) => {
      revoked.push(token);
    },
  });
  const started = flow.begin({
    browserOrigin: browser,
    homeAssistantOrigin: ha,
    intent: 'login',
    secure: false,
  });
  await assert.rejects(
    flow.complete({
      state: new URL(started.authorizationUrl).searchParams.get('state'),
      binding: started.transactionCookie.split(';')[0].split('=')[1],
      code: 'x',
      callbackOrigin: browser,
      secure: false,
    }),
    (error: Error & { code?: string }) => error.code === 'NOT_ADMIN',
  );
  assert.deepEqual(revoked, ['r']);
  assert.equal(repository.status().state, 'unconfigured');
});

test('reset command forgets the connection and revokes its token', async (t) => {
  const { resetConnection } = await import('../apps/server/src/auth/reset-connection');
  const { writeFileSync } = await import('node:fs');
  const directory = mkdtempSync(join(tmpdir(), 'oauth-reset-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repository = new ConnectorRepository({ directory });
  await repository.install({ origin: ha, clientId: browser, refreshToken: 'old' });
  const revoked: string[] = [];
  assert.deepEqual(
    await resetConnection(directory, async (_origin, token) => {
      revoked.push(token);
    }),
    { removed: ha, revoked: true },
  );
  assert.deepEqual(revoked, ['old']);
  assert.equal(repository.status().state, 'unconfigured');
  assert.deepEqual(await resetConnection(directory), { removed: null, revoked: false });

  writeFileSync(join(directory, 'connector.json'), '{');
  assert.equal(repository.status().state, 'repair-required');
  await resetConnection(directory);
  assert.equal(repository.status().state, 'unconfigured');
});
