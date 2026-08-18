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

test('describeScrubPolicy returns a summary string', () => {
  const summary = describeScrubPolicy();
  assert.equal(typeof summary, 'string');
  assert.ok(summary.length > 0);
});
