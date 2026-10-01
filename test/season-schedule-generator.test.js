import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSeasonRoundDates, usObservedHolidays } from '../src/seasonScheduleGenerator.js';

test('US holidays include Independence Day observed', () => {
  const h = usObservedHolidays(2026);
  assert.ok(h.some((x) => x.id === 'independence'));
});

test('blackout skips date and still yields full round count', () => {
  const result = generateSeasonRoundDates({
    startDate: '2026-06-30', // Tuesday
    weekday: 2,
    roundCount: 7,
    extraBlackouts: ['2026-07-07'],
  });
  assert.equal(result.rounds.length, 7);
  assert.ok(!result.rounds.some((r) => r.date === '2026-07-07'));
});
