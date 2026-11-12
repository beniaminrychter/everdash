import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OAuthTransactions } from '../apps/server/src/auth/admin-state';
import { AdminSessions } from '../apps/server/src/auth/admin-sessions';
import {
  transactionCookie,
  clearTransactionCookie,
  adminCookie,
  clearAdminCookie,
  readCookie,
} from '../apps/server/src/auth/admin-cookies';

const input = {
  origin: 'https://ha.example',
  clientId: 'https://dash.example/',
  redirectUri: 'https://dash.example/api/auth/callback',
  intent: 'login' as const,
};

test('transactions are independently random, browser bound, single use and expire', () => {
  let now = 0;
  const store = new OAuthTransactions({ now: () => now, capacity: 2 });
  const first = store.create(input);
  const second = store.create(input);
  assert.notEqual(first.state, first.binding);
  assert.notEqual(first.state, second.state);
  assert.notEqual(first.binding, second.binding);
  assert.equal(store.consume(first.state, second.binding), null);
  assert.equal(store.consume('wrong', first.binding), null);
  assert.deepEqual(store.consume(first.state, first.binding), input);
  assert.equal(store.consume(first.state, first.binding), null);
  now = 600_000;
  assert.equal(store.consume(second.state, second.binding), null);
});

test('transaction capacity evicts oldest and prunes expired records', () => {
  let now = 0;
  const store = new OAuthTransactions({ now: () => now, capacity: 2 });
  const first = store.create(input);
  const second = store.create(input);
  const third = store.create(input);
  assert.equal(store.consume(first.state, first.binding), null);
  assert.deepEqual(store.consume(second.state, second.binding), input);
  now = 600_000;
  const fourth = store.create(input);
  assert.equal(store.consume(third.state, third.binding), null);
  assert.deepEqual(store.consume(fourth.state, fourth.binding), input);
});

test('admin sessions enforce absolute expiry, origin, generation and local logout', () => {
  let now = 0;
  const sessions = new AdminSessions({ now: () => now, capacity: 2 });
  const identity = { userId: 'admin', origin: input.origin, generation: 'generation-1' };
  const token = sessions.issue(identity);
  assert.equal(sessions.read(`${token}x`, identity.origin, identity.generation), null);
  assert.equal(sessions.read(token, 'https://other.example', identity.generation), null);
  assert.equal(sessions.read(token, identity.origin, 'generation-2'), null);
  now = 28_799_999;
  assert.deepEqual(sessions.read(token, identity.origin, identity.generation), identity);
  now = 28_800_000;
  assert.equal(sessions.read(token, identity.origin, identity.generation), null);
  const a = sessions.issue(identity);
  const b = sessions.issue(identity);
  sessions.logout(a);
  assert.equal(sessions.read(a, identity.origin, identity.generation), null);
  assert.deepEqual(sessions.read(b, identity.origin, identity.generation), identity);
  const c = sessions.issue(identity);
  const d = sessions.issue(identity);
  assert.equal(sessions.read(b, identity.origin, identity.generation), null);
  assert.ok(sessions.read(c, identity.origin, identity.generation));
  assert.ok(sessions.read(d, identity.origin, identity.generation));
});

test('cookies have scoped security attributes and reject ambiguous or unsafe values', () => {
  const tx = transactionCookie('abc_123', true);
  assert.match(
    tx,
    /^everdash_oauth=abc_123; Path=\/api\/auth; HttpOnly; SameSite=Lax; Max-Age=600; Secure$/,
  );
  assert.match(
    clearTransactionCookie(true),
    /^everdash_oauth=; Path=\/api\/auth; HttpOnly; SameSite=Lax; Max-Age=0; Secure$/,
  );
  assert.match(
    adminCookie('abc_123', false),
    /^everdash_admin=abc_123; Path=\/api\/manage; HttpOnly; SameSite=Strict$/,
  );
  assert.match(
    clearAdminCookie(true),
    /^everdash_admin=; Path=\/api\/manage; HttpOnly; SameSite=Strict; Max-Age=0; Secure$/,
  );
  assert.equal(readCookie('other=x; everdash_oauth=abc_123', 'everdash_oauth'), 'abc_123');
  assert.equal(readCookie('everdash_oauth=one; everdash_oauth=two', 'everdash_oauth'), null);
  assert.equal(readCookie('everdash_oauth=bad%20value', 'everdash_oauth'), null);
  assert.equal(readCookie('everdash_oauth=one=two', 'everdash_oauth'), null);
  assert.throws(() => adminCookie('bad;value', false));
});
