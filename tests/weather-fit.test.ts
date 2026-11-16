import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fitEntries,
  fullRowZones,
  halfRowEntries,
} from '@everdash/dashboard/features/weather/data/fit';

test('a one-row card shows as many entries as fit, or none when fewer than two would', () => {
  assert.equal(fitEntries(undefined, 5), 5);
  assert.equal(fitEntries(300, 5), 5);
  assert.equal(fitEntries(150, 5), 3);
  assert.equal(fitEntries(267, 3), 3);
  assert.equal(fitEntries(91, 5), 0);
  assert.equal(fitEntries(92, 5), 2);
  assert.equal(fitEntries(0, 5), 0);
});

test('a full one-row card drops its details before it drops its forecast', () => {
  assert.deepEqual(fullRowZones(undefined), { details: true, entries: 5 });
  assert.deepEqual(fullRowZones(732), { details: true, entries: 5 });
  assert.deepEqual(fullRowZones(524), { details: false, entries: 5 });
  assert.deepEqual(fullRowZones(299), { details: false, entries: 0 });
});

test('a half one-row card shows three entries when they fit and none when fewer than two do', () => {
  assert.equal(halfRowEntries(undefined), 3);
  assert.equal(halfRowEntries(442), 3);
  assert.equal(halfRowEntries(250), 0);
});
