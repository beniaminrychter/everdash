import assert from 'node:assert/strict';
import test from 'node:test';
import { clearAppShell, reloadUrl } from '../src/app/hardReload';

test('hard reload removes only this app’s scoped worker and caches', async () => {
  const scope = 'https://home.example/local/my-home/';
  const own = `everdash-${encodeURIComponent(scope)}-old`;
  const legacyOwn = `my-home-${encodeURIComponent(scope)}-old`;
  const removed: string[] = [];
  let unregistered = 0;
  await clearAppShell(
    `${scope}index.html`,
    {
      getRegistration: async () => ({
        active: { scriptURL: scope + 'sw.js' },
        scope,
        unregister: async () => {
          unregistered++;
          return true;
        },
      }),
    },
    {
      delete: async (name: string) => {
        removed.push(name);
        return true;
      },
      keys: async () => [
        own,
        legacyOwn,
        'another-app',
        'my-home-' + encodeURIComponent('https://home.example/other/') + '-old',
      ],
    },
  );
  assert.equal(unregistered, 1);
  assert.deepEqual(removed, [own, legacyOwn]);
});

test('hard reload never unregisters a parent worker or another script in the same scope', async () => {
  for (const registration of [
    { active: { scriptURL: 'https://home.example/sw.js' }, scope: 'https://home.example/' },
    {
      active: { scriptURL: 'https://home.example/local/my-home/other-worker.js' },
      scope: 'https://home.example/local/my-home/',
    },
  ]) {
    await clearAppShell('https://home.example/local/my-home/', {
      getRegistration: async () => ({
        ...registration,
        unregister: async () => {
          assert.fail('Unrelated worker removed');
        },
      }),
    });
  }
  await clearAppShell('http://home.example/local/my-home/');
});

test('reload URL replaces the cache-busting marker while preserving query and hash', () => {
  const url = new URL(reloadUrl('https://home.example/app/?mode=test&__reload=old#room', 123));
  assert.equal(url.searchParams.get('mode'), 'test');
  assert.equal(url.searchParams.get('__reload'), '123');
  assert.equal(url.hash, '#room');
});
