import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildApp } from '../apps/server/src/app';
import { ConfigRepository } from '../apps/server/src/config/repository';

test('serves the tablet shell at / and the admin app at /admin/ without granting management', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-frontends-'));
  const admin = join(directory, 'admin');
  const tablet = join(directory, 'tablet');
  await Promise.all([mkdir(admin), mkdir(tablet)]);
  await Promise.all([
    writeFile(join(admin, 'index.html'), 'modern-admin'),
    writeFile(join(tablet, 'index.html'), 'ios12-tablet'),
  ]);
  const app = await buildApp({
    config: new ConfigRepository({ directory: join(directory, 'data') }),
    access: { isAdmin: () => false, isTablet: () => true },
    staticDirectory: tablet,
    adminStaticDirectory: admin,
    homeAssistant: {
      getState: async () => ({}),
      getStates: async () => [],
      callService: async () => null,
    },
  });
  try {
    assert.equal((await app.inject('/')).body, 'ios12-tablet');
    assert.equal((await app.inject('/admin/')).body, 'modern-admin');
    assert.equal((await app.inject('/api/manage/access')).statusCode, 401);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
