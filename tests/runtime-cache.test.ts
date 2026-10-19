import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearOfflineRuntimeConfig,
  runtimeConfigStorageKey,
} from '../src/shared/config/runtime-cache';

test('logout clears only the private offline dashboard snapshot and keeps preferences', () => {
  const values = new Map([
    [runtimeConfigStorageKey, '{"revision":"offline"}'],
    ['my-home:preferences:v1', '{"language":"pl"}'],
    ['another-app:layout', 'kept'],
  ]);
  clearOfflineRuntimeConfig({ removeItem: (key) => values.delete(key) });
  assert.equal(values.has(runtimeConfigStorageKey), false);
  assert.equal(values.get('my-home:preferences:v1'), '{"language":"pl"}');
  assert.equal(values.get('another-app:layout'), 'kept');
});
