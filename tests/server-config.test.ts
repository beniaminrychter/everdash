import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ConfigRepository } from '../server/config/repository';

const empty = {
  schemaVersion: 1,
  views: [{ id: 'home', title: 'Home', cards: [] }],
};

async function withDirectory(run: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-config-'));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('starts with the generic empty dashboard without persisting private defaults', async () => {
  await withDirectory(async (directory) => {
    const repository = new ConfigRepository({ directory });
    const snapshot = repository.read();
    assert.ok(snapshot);
    assert.equal(snapshot.config.schemaVersion, 1);
    assert.equal(snapshot.config.views[0].id, 'home');
    assert.equal(snapshot.config.views[0].cards?.length, 0);
    assert.equal(await readdir(directory).then((files) => files.length), 0);
    assert.equal(repository.diagnostic, null);
  });
});

test('saves validated canonical documents with stable revisions and retains previous', async () => {
  await withDirectory(async (directory) => {
    const repository = new ConfigRepository({ directory });
    const published: string[] = [];
    repository.addEventListener('change', (event) => {
      published.push((event as Event & { snapshot: { revision: string } }).snapshot.revision);
    });
    const initial = repository.read();
    assert.ok(initial);
    const first = await repository.save(initial.revision, {
      ...empty,
      views: [{ id: 'home', title: 'First', cards: [] }],
    });
    const saved = await repository.save(first.revision, {
      ...empty,
      views: [{ id: 'home', title: 'Renamed', cards: [] }],
    });
    assert.match(saved.revision, /^[a-f0-9]{64}$/);
    assert.deepEqual(published, [first.revision, saved.revision]);
    assert.equal(repository.readPrevious()?.views[0].title, 'First');
    assert.equal(
      (await readFile(join(directory, 'dashboard.json'), 'utf8')).includes('Renamed'),
      true,
    );
    const restarted = new ConfigRepository({ directory }).read();
    assert.deepEqual(restarted, saved);
    const reorderedInput = {
      views: [{ cards: [], title: 'Renamed', id: 'home' }],
      schemaVersion: 1,
    };
    const validation = repository.validate(reorderedInput);
    assert.equal(validation.ok, true);
    if (validation.ok) {
      assert.equal(repository.revision(validation.document), saved.revision);
    }
  });
});

test('rejects invalid documents and stale revisions without publishing them', async () => {
  await withDirectory(async (directory) => {
    const repository = new ConfigRepository({ directory });
    const initial = repository.read();
    assert.ok(initial);
    assert.equal(repository.validate({ schemaVersion: 1, views: [] }).ok, false);
    await assert.rejects(repository.save('stale', empty), { code: 'CONFIG_CONFLICT' });
    await assert.rejects(repository.save(initial.revision, { schemaVersion: 2 }), {
      code: 'CONFIG_INVALID',
    });
    assert.equal(repository.read()?.revision, initial.revision);
    assert.equal(repository.readPrevious(), null);
  });
});

test('serializes concurrent saves and rejects the save based on an obsolete revision', async () => {
  await withDirectory(async (directory) => {
    const repository = new ConfigRepository({ directory });
    const initial = repository.read();
    assert.ok(initial);
    const first = { ...empty, views: [{ id: 'home', title: 'First', cards: [] }] };
    const second = { ...empty, views: [{ id: 'home', title: 'Second', cards: [] }] };
    const results = await Promise.allSettled([
      repository.save(initial.revision, first),
      repository.save(initial.revision, second),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
    assert.ok(repository.read());
    const disk = JSON.parse(await readFile(join(directory, 'dashboard.json'), 'utf8'));
    assert.ok(['First', 'Second'].includes(disk.views[0].title));
  });
});

test('a failed write keeps the published revision and removes temporary files', async () => {
  await withDirectory(async (directory) => {
    const repository = new ConfigRepository({
      directory,
      fault(point) {
        if (point === 'beforeCurrentRename') {
          throw new Error('simulated interrupted write');
        }
      },
    });
    const initial = repository.read();
    assert.ok(initial);
    await assert.rejects(
      repository.save(initial.revision, {
        ...empty,
        views: [{ id: 'home', title: 'Never published', cards: [] }],
      }),
      /simulated interrupted write/,
    );
    assert.equal(repository.read()?.revision, initial.revision);
    assert.equal(
      await readdir(directory).then((files) => files.some((file) => file.endsWith('.tmp'))),
      false,
    );
    assert.equal(
      await readFile(join(directory, 'dashboard.json'), 'utf8').then(
        () => false,
        () => true,
      ),
      true,
    );
  });
});

test('recovers a corrupt current document from its valid previous copy', async () => {
  await withDirectory(async (directory) => {
    await writeFile(join(directory, 'dashboard.json'), '{broken');
    await writeFile(join(directory, 'dashboard.previous.json'), JSON.stringify(empty));
    const repository = new ConfigRepository({ directory });
    const recovered = repository.read();
    assert.equal(recovered?.config.schemaVersion, 1);
    assert.equal(recovered?.config.views[0].title, 'Home');
    assert.equal(repository.diagnostic?.code, 'RECOVERED_PREVIOUS');
    assert.deepEqual(
      JSON.parse(await readFile(join(directory, 'dashboard.json'), 'utf8')),
      recovered?.config,
    );
  });
});

test('does not overwrite data when both persisted dashboard copies are invalid', async () => {
  await withDirectory(async (directory) => {
    await writeFile(join(directory, 'dashboard.json'), '{current broken');
    await writeFile(join(directory, 'dashboard.previous.json'), '{previous broken');
    const repository = new ConfigRepository({ directory });
    assert.equal(repository.read(), null);
    assert.equal(repository.diagnostic?.code, 'CONFIG_RECOVERY_REQUIRED');
    assert.equal(await readFile(join(directory, 'dashboard.json'), 'utf8'), '{current broken');
    assert.equal(
      await readFile(join(directory, 'dashboard.previous.json'), 'utf8'),
      '{previous broken',
    );
  });
});

test('reports unwritable storage without changing the live snapshot', async () => {
  await withDirectory(async (directory) => {
    const repository = new ConfigRepository({
      directory,
      fault(point) {
        if (point === 'beforeCurrentTemp') {
          throw new Error('storage is read-only');
        }
      },
    });
    const initial = repository.read();
    assert.ok(initial);
    await assert.rejects(repository.save(initial.revision, empty), /storage is read-only/);
    assert.equal(repository.read()?.revision, initial.revision);
  });
});
