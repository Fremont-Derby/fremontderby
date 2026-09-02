import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeEngagement } from '../src/engagementCounters.js';

test('summarizeEngagement returns numeric counts only', () => {
  assert.deepEqual(summarizeEngagement(), {
    threads: 0,
    messages: 0,
    participants: 0,
    openReports: 0,
  });
  assert.deepEqual(
    summarizeEngagement({ threads: 3, messages: 12, participants: 5, openReports: 1 }),
    { threads: 3, messages: 12, participants: 5, openReports: 1 },
  );
});

test('summarizeEngagement coerces non-numeric and never includes content keys', () => {
  const out = summarizeEngagement({
    threads: '2',
    messages: null,
    participants: undefined,
    openReports: 'x',
    content: 'secret',
    authorIds: ['a', 'b'],
  });
  assert.deepEqual(out, {
    threads: 2,
    messages: 0,
    participants: 0,
    openReports: 0,
  });
  assert.equal(Object.keys(out).sort().join(','), 'messages,openReports,participants,threads');
});
