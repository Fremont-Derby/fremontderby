import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describeScrubPolicy,
  scrubSqlStatements,
} from '../scripts/gamma-refresh/scrub-policy.mjs';

test('scrubSqlStatements is non-empty and gamma-scoped', () => {
  assert.ok(scrubSqlStatements.length > 0);
  for (const sql of scrubSqlStatements) {
    assert.match(sql, /\bgamma\./i);
  }
});

test('describeScrubPolicy returns versioned actions summary', () => {
  const summary = describeScrubPolicy();
  assert.equal(typeof summary, 'object');
  assert.ok(summary.version >= 1);
  assert.ok(Array.isArray(summary.actions));
  assert.ok(summary.actions.length > 0);
});
