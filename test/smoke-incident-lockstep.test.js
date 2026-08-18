import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_SMOKE_STATUS_MARKER,
  MAX_SMOKE_DIAGNOSTIC_CHARACTERS,
  sanitizeSmokeDiagnostics,
  buildProductionSmokeFailureBody,
  findLatestProductionSmokeStatusComment,
} from '../scripts/production-smoke-incident.mjs';

test('PRODUCTION_SMOKE_STATUS_MARKER is stable', () => {
  assert.equal(PRODUCTION_SMOKE_STATUS_MARKER, '<!-- production-smoke-status-v1 -->');
  assert.equal(MAX_SMOKE_DIAGNOSTIC_CHARACTERS, 6000);
});

test('sanitizeSmokeDiagnostics escapes fences and trims', () => {
  const out = sanitizeSmokeDiagnostics('  hello ``` world  ');
  assert.match(out, /hello/);
  assert.doesNotMatch(out, /```/);
});

test('buildProductionSmokeFailureBody requires sha and runUrl', () => {
  assert.throws(() => buildProductionSmokeFailureBody({ runUrl: 'https://x' }), /sha is required/);
  const body = buildProductionSmokeFailureBody({
    sha: 'abc',
    runUrl: 'https://example/run',
    diagnostics: 'boom',
  });
  assert.match(body, /production-smoke-status-v1/);
  assert.match(body, /`abc`/);
  assert.match(body, /boom/);
});

test('findLatestProductionSmokeStatusComment picks highest id owned marker', () => {
  const comments = [
    { id: 1, user: { login: 'github-actions[bot]' }, body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nold` },
    { id: 3, user: { login: 'github-actions[bot]' }, body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nnew` },
    { id: 2, user: { login: 'human' }, body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nnope` },
  ];
  const latest = findLatestProductionSmokeStatusComment(comments);
  assert.equal(latest.id, 3);
});
