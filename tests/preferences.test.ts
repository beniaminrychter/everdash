import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readPreferences,
  savePreferences,
  resolveTheme,
  preferenceKey,
} from '../src/features/settings/data/preferences';

const pages = [
  { id: 'first-floor', name: 'First floor' },
  { id: 'upstairs', name: 'Upstairs' },
];
function storage(value: string | null = null) {
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
}
test('dashboard and explicit appearance survive a reload', () => {
  const saved = storage();
  assert.equal(
    savePreferences(saved, { appearance: 'light', language: 'en', page: 'upstairs' }),
    true,
  );
  assert.deepEqual(readPreferences(saved, pages), {
    appearance: 'light',
    language: 'en',
    page: 'upstairs',
  });
  assert.equal(preferenceKey, 'my-home:preferences:v1');
});
test('corrupt or removed preferences fall back safely and storage failures do not prevent boot', () => {
  const expected = { appearance: 'auto', language: 'en', page: 'first-floor' };
  for (const value of ['{', 'null', '[]', '{"page":"removed","appearance":"blue"}']) {
    assert.deepEqual(readPreferences(storage(value), pages), expected);
  }
  const blocked = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };
  assert.deepEqual(readPreferences(blocked, pages), expected);
  assert.equal(savePreferences(blocked, expected), false);
});
test('automatic appearance follows HA sunrise and sunset; explicit modes override it', () => {
  assert.equal(resolveTheme('auto', 'above_horizon', true), 'light');
  assert.equal(resolveTheme('auto', 'below_horizon', false), 'dark');
  assert.equal(resolveTheme('light', 'below_horizon', true), 'light');
  assert.equal(resolveTheme('dark', 'above_horizon', false), 'dark');
  assert.equal(resolveTheme('auto', undefined, true), 'dark');
  assert.equal(resolveTheme('auto', 'unavailable', false), 'light');
});

test('language is persisted, existing preferences migrate to English, invalid languages fall back', () => {
  const saved = storage();
  savePreferences(saved, { appearance: 'dark', language: 'pl', page: 'upstairs' });
  assert.equal(readPreferences(saved, pages).language, 'pl');
  assert.equal(
    readPreferences(storage('{"page":"upstairs","appearance":"light"}'), pages).language,
    'en',
  );
  assert.equal(readPreferences(storage('{"language":"de"}'), pages).language, 'en');
});
