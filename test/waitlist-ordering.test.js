import assert from 'node:assert/strict';
import test from 'node:test';
import { nextWaitlistPromotion, orderWaitlist } from '../src/waitlistOrdering.js';

test('orders nine qualified teams by first_qualified_at then submitted_at (no strength)', () => {
  const entries = [];
  for (let i = 9; i >= 1; i -= 1) {
    entries.push({
      id: `00000000-0000-4000-8000-0000000000${String(i).padStart(2, '0')}`,
      firstQualifiedAt: `2026-08-0${Math.min(i, 9)}T12:00:00.000Z`,
      submittedAt: `2026-08-01T0${i}:00:00.000Z`,
      fargo: 900 - i, // must be ignored
    });
  }
  const ordered = orderWaitlist(entries);
  assert.equal(ordered.length, 9);
  assert.equal(ordered[0].id.endsWith('01'), true);
  assert.equal(ordered[8].id.endsWith('09'), true);
  assert.equal(ordered[0].position, 1);
  assert.equal(ordered[8].position, 9);
});

test('admin override rank beats chronological qualification', () => {
  const ordered = orderWaitlist([
    { id: 'a', firstQualifiedAt: '2026-08-01T00:00:00.000Z', submittedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'b', firstQualifiedAt: '2026-08-02T00:00:00.000Z', submittedAt: '2026-08-02T00:00:00.000Z', waitlistRankOverride: 1 },
    { id: 'c', firstQualifiedAt: '2026-08-01T12:00:00.000Z', submittedAt: '2026-08-01T12:00:00.000Z' },
  ]);
  assert.equal(ordered[0].id, 'b');
  assert.equal(ordered[1].id, 'a');
  assert.equal(ordered[2].id, 'c');
});

test('tie on qualified_at falls back to submitted_at then id', () => {
  const ordered = orderWaitlist([
    { id: 'm', firstQualifiedAt: '2026-08-01T10:00:00.000Z', submittedAt: '2026-08-01T11:00:00.000Z' },
    { id: 'k', firstQualifiedAt: '2026-08-01T10:00:00.000Z', submittedAt: '2026-08-01T10:30:00.000Z' },
  ]);
  assert.equal(ordered[0].id, 'k');
  assert.equal(nextWaitlistPromotion(ordered).id, 'k');
});

test('slot release promotes next eligible waitlisted entry deterministically', () => {
  const waitlisted = orderWaitlist([
    { id: 'later', firstQualifiedAt: '2026-08-03T00:00:00.000Z', submittedAt: '2026-08-03T00:00:00.000Z' },
    { id: 'earlier', firstQualifiedAt: '2026-08-02T00:00:00.000Z', submittedAt: '2026-08-02T00:00:00.000Z' },
  ]);
  assert.equal(nextWaitlistPromotion(waitlisted).id, 'earlier');
});
