import assert from 'node:assert/strict';
import test from 'node:test';
import { tokenizeJsonLines } from '../apps/admin/src/features/json/jsonHighlight';
import { validateJsonText } from '../apps/admin/src/features/json/jsonValidation';

test('tokenizeJsonLines classifies keys, values, punctuation, and invalid tokens per line', () => {
  const lines = tokenizeJsonLines(
    '{\n  "schemaVersion": 1,\n  "sun": "sun.sun",\n  "ok": true,\n  "none": null,\n  oops\n}',
  );

  assert.equal(lines.length, 7);
  assert.deepEqual(
    lines[1]!.filter((token) => token.kind !== 'whitespace'),
    [
      { kind: 'key', value: '"schemaVersion"' },
      { kind: 'punctuation', value: ':' },
      { kind: 'number', value: '1' },
      { kind: 'punctuation', value: ',' },
    ],
  );
  assert.deepEqual(
    lines[2]!.filter((token) => token.kind !== 'whitespace'),
    [
      { kind: 'key', value: '"sun"' },
      { kind: 'punctuation', value: ':' },
      { kind: 'string', value: '"sun.sun"' },
      { kind: 'punctuation', value: ',' },
    ],
  );
  assert.equal(
    lines[3]!.some((token) => token.kind === 'boolean' && token.value === 'true'),
    true,
  );
  assert.equal(
    lines[4]!.some((token) => token.kind === 'null' && token.value === 'null'),
    true,
  );
  assert.equal(
    lines[5]!.some((token) => token.kind === 'invalid' && token.value === 'oops'),
    true,
  );
});

test('validateJsonText performs live syntax and schema validation with line detection', () => {
  const valid = validateJsonText(
    JSON.stringify(
      {
        schemaVersion: 1,
        views: [{ id: 'home', title: 'Home', cards: [], badges: [] }],
      },
      null,
      2,
    ),
  );

  assert.equal(valid.ok, true);
  assert.deepEqual(valid.issues, []);
  assert.equal(valid.errorLine, null);
  assert.equal(valid.document?.views[0]?.title, 'Home');

  const syntaxBad = validateJsonText('{\n  "schemaVersion": 1,\n  "views": [\n  ],\n}');

  assert.equal(syntaxBad.ok, false);
  assert.equal(syntaxBad.errorLine, 5);
  assert.equal(syntaxBad.issues.length, 1);

  const schemaBad = validateJsonText(
    JSON.stringify(
      {
        schemaVersion: 1,
        views: [{ id: 'home', title: '', cards: [], badges: [] }],
      },
      null,
      2,
    ),
  );

  assert.equal(schemaBad.ok, false);
  assert.equal(
    schemaBad.issues.some((issue) => issue.includes('views[0].title')),
    true,
  );
  assert.equal(schemaBad.errorLine, 6);
});
