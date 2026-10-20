import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDockerBinary } from '../scripts/local-docker.mjs';

test('uses Docker Desktop bundled CLI when macOS has no docker command on PATH', () => {
  assert.equal(
    resolveDockerBinary(
      'darwin',
      () => false,
      (path) => path.endsWith('/Applications/Docker.app/Contents/Resources/bin/docker'),
    ),
    '/Applications/Docker.app/Contents/Resources/bin/docker',
  );
});

test('uses the PATH command when available on any platform', () => {
  assert.equal(
    resolveDockerBinary(
      'linux',
      () => true,
      () => false,
    ),
    'docker',
  );
});

test('returns no Docker executable when neither the PATH nor Docker Desktop has one', () => {
  assert.equal(
    resolveDockerBinary(
      'linux',
      () => false,
      () => false,
    ),
    null,
  );
});
