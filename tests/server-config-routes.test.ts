import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildApp } from '../server/app';
import { ConfigRepository } from '../server/config/repository';

const first = { schemaVersion: 1, views: [{ id: 'home', title: 'Home', cards: [] }] };
const second = { schemaVersion: 1, views: [{ id: 'home', title: 'Rooms', cards: [] }] };

test('management config routes validate drafts, publish with revision checks and expose previous as draft data', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-config-routes-'));
  const config = new ConfigRepository({ directory });
  const app = await buildApp(
    {
      config,
      authorize: async (_request, mode) => mode === 'management',
      expectedOrigin: () => 'http://ha.local',
      homeAssistant: {
        getState: async () => ({}),
        getStates: async () => [],
        callService: async () => null,
      },
    },
    'management',
  );
  const headers = { origin: 'http://ha.local', 'x-everdash-request': '1' };
  try {
    const initial = config.read();
    assert.ok(initial);
    const validation = await app.inject({
      method: 'POST',
      url: '/api/manage/config/validate',
      headers,
      payload: { config: second },
    });
    assert.equal(validation.statusCode, 200);
    assert.equal(config.read()?.revision, initial.revision);
    assert.equal(validation.json().config.views[0].title, 'Rooms');

    const invalid = await app.inject({
      method: 'POST',
      url: '/api/manage/config/validate',
      headers,
      payload: { config: { schemaVersion: 90 } },
    });
    assert.equal(invalid.statusCode, 422);
    assert.ok(invalid.json().issues.length > 0);

    const saved = await app.inject({
      method: 'PUT',
      url: '/api/manage/config',
      headers,
      payload: { baseRevision: initial.revision, config: first },
    });
    assert.equal(saved.statusCode, 200);
    const firstRevision = saved.json().revision;
    const updated = await app.inject({
      method: 'PUT',
      url: '/api/manage/config',
      headers,
      payload: { baseRevision: firstRevision, config: second },
    });
    assert.equal(updated.statusCode, 200);
    assert.equal(updated.json().config.views[0].title, 'Rooms');

    const stale = await app.inject({
      method: 'PUT',
      url: '/api/manage/config',
      headers,
      payload: { baseRevision: firstRevision, config: first },
    });
    assert.equal(stale.statusCode, 409);
    assert.equal(config.read()?.config.views[0].title, 'Rooms');

    const current = await app.inject({ method: 'GET', url: '/api/manage/config' });
    assert.equal(current.json().revision, updated.json().revision);
    assert.equal(current.json().config.views[0].title, 'Rooms');
    assert.equal(current.json().previousAvailable, true);
    const previous = await app.inject({ method: 'GET', url: '/api/manage/config/previous' });
    assert.equal(previous.json().config.views[0].title, 'Home');
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
