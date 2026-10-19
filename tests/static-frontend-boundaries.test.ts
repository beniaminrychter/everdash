import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildApp } from '../server/app';
import { ConfigRepository } from '../server/config/repository';

test('management serves the React builder and tablet preview while direct serves only the tablet shell', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-frontends-'));
  const admin = join(directory, 'admin');
  const tablet = join(directory, 'tablet');
  const preview = join(directory, 'preview');
  await Promise.all([mkdir(admin), mkdir(tablet), mkdir(preview)]);
  await Promise.all([
    writeFile(join(admin, 'index.html'), 'modern-admin'),
    writeFile(join(tablet, 'index.html'), 'ios12-tablet'),
    writeFile(join(preview, 'index.html'), 'preact-preview'),
  ]);
  const dependencies = {
    config: new ConfigRepository({ directory: join(directory, 'data') }),
    authorize: async () => true,
    staticDirectory: admin,
    previewDirectory: preview,
    homeAssistant: {
      getState: async () => ({}),
      getStates: async () => [],
      callService: async () => null,
    },
  };
  const management = await buildApp(dependencies, 'management');
  const direct = await buildApp(
    { ...dependencies, staticDirectory: tablet, previewDirectory: undefined },
    'direct',
  );
  try {
    assert.equal((await management.inject('/')).body, 'modern-admin');
    assert.equal((await management.inject('/preview/')).body, 'preact-preview');
    assert.equal(
      (await management.inject('/preview/')).headers['access-control-allow-origin'],
      '*',
    );
    assert.equal((await direct.inject('/')).body, 'ios12-tablet');
    assert.equal((await direct.inject('/preview/')).statusCode, 404);
    assert.equal((await direct.inject('/api/manage/access')).statusCode, 403);
  } finally {
    await Promise.all([management.close(), direct.close()]);
    await rm(directory, { recursive: true, force: true });
  }
});
