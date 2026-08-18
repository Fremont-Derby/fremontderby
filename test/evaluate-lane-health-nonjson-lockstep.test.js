import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLaneHealthBody } from '../scripts/assert-lane-health.mjs';

test('evaluateLaneHealthBody rejects non-JSON bodies', () => {
  const result = evaluateLaneHealthBody('dru.fremontderby.com', 'dru', 200, '<html>nope</html>');
  assert.equal(result.ok, false);
  assert.match(result.error, /non-JSON/);
});

test('evaluateLaneHealthBody rejects non-2xx with environment mismatch detail', () => {
  const result = evaluateLaneHealthBody(
    'jfl.fremontderby.com',
    'jfl',
    503,
    JSON.stringify({ environment: 'jfl', ok: false, checks: [{ name: 'supabase', ok: false }] }),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /HTTP 503/);
});
