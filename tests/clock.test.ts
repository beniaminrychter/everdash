import assert from 'node:assert/strict';
import test from 'node:test';
import { formatClock } from '@everdash/dashboard/features/clock/data/format';

// A Monday afternoon in the device's own time zone.
process.env.TZ = 'UTC';
const monday = Date.UTC(2026, 10, 16, 14, 5, 30);

test('the clock formats time, date or both for the dashboard locale', () => {
  assert.deepEqual(formatClock(monday, 'time', 'en-GB'), { primary: '14:05' });
  assert.deepEqual(formatClock(monday, 'date', 'en-GB'), {
    primary: 'Monday',
    secondary: '16 November',
  });

  const both = formatClock(monday, 'datetime', 'en-GB');
  assert.equal(both.primary, '14:05');
  assert.match(both.secondary ?? '', /^Monday,? 16 November$/);
});

test('the clock follows the Polish locale', () => {
  assert.deepEqual(formatClock(monday, 'date', 'pl-PL'), {
    primary: 'poniedziałek',
    secondary: '16 listopada',
  });
});
