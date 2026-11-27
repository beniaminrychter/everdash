import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countJsonChanges,
  countSerializedJsonChanges,
  diffJsonLines,
} from '../apps/admin/src/app/draft/jsonDiff';
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

test('countJsonChanges and countSerializedJsonChanges count real structural differences', () => {
  const baseline = {
    schemaVersion: 1,
    views: [
      {
        id: 'home',
        title: 'Home',
        cards: [
          { type: 'light', entity: 'light.a' },
          { type: 'outlet', entity: 'switch.b' },
        ],
      },
    ],
  };

  assert.equal(countJsonChanges(baseline, structuredClone(baseline)), 0);

  const iconChanged = structuredClone(baseline);
  (iconChanged.views[0]!.cards[0] as { icon?: string }).icon = 'lamp';
  assert.equal(countJsonChanges(baseline, iconChanged), 1);

  const reordered = structuredClone(baseline);
  reordered.views[0]!.cards.reverse();
  assert.equal(countJsonChanges(baseline, reordered), 1);

  const addedCard = structuredClone(baseline);
  addedCard.views[0]!.cards.push({ type: 'light', entity: 'light.c' });
  assert.equal(countJsonChanges(baseline, addedCard), 1);

  assert.equal(
    countSerializedJsonChanges(
      JSON.stringify(baseline, null, 2),
      JSON.stringify(iconChanged, null, 2),
    ),
    1,
  );
  assert.equal(
    countSerializedJsonChanges(
      JSON.stringify(baseline, null, 2),
      JSON.stringify(baseline, null, 2),
    ),
    0,
  );
});

test('diffJsonLines computes added, removed, and context lines between saved and unsaved JSON', () => {
  const previous = '{\n  "schemaVersion": 1,\n  "timeZone": "Europe/London"\n}';
  const current = '{\n  "schemaVersion": 1,\n  "timeZone": "Europe/Warsaw"\n}';

  const unchanged = diffJsonLines(previous, previous);
  assert.equal(unchanged.hasChanges, false);
  assert.equal(unchanged.added, 0);
  assert.equal(unchanged.removed, 0);

  const diff = diffJsonLines(previous, current);
  assert.equal(diff.hasChanges, true);
  assert.equal(diff.added, 1);
  assert.equal(diff.removed, 1);
  assert.deepEqual(
    diff.lines.filter((line) => line.kind !== 'context').map((line) => [line.kind, line.text]),
    [
      ['removed', '  "timeZone": "Europe/London"'],
      ['added', '  "timeZone": "Europe/Warsaw"'],
    ],
  );
});
