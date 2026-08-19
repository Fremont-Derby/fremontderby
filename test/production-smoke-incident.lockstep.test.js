import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_SMOKE_STATUS_MARKER,
  MAX_SMOKE_DIAGNOSTIC_CHARACTERS,
  sanitizeSmokeDiagnostics,
  findLatestProductionSmokeStatusComment,
  buildProductionSmokeFailureBody,
} from '../scripts/production-smoke-incident.mjs';

test('status marker and diagnostic cap are locked', () => {
  assert.equal(PRODUCTION_SMOKE_STATUS_MARKER, '<!-- production-smoke-status-v1 -->');
  assert.equal(MAX_SMOKE_DIAGNOSTIC_CHARACTERS, 6000);
});

test('sanitizeSmokeDiagnostics neutralizes fences and truncates from the end', () => {
  assert.equal(sanitizeSmokeDiagnostics(''), 'Smoke output was unavailable.');
  assert.equal(sanitizeSmokeDiagnostics(null), 'Smoke output was unavailable.');
  assert.ok(!sanitizeSmokeDiagnostics('bad ``` fence').includes('```'));

  const long = 'x'.repeat(MAX_SMOKE_DIAGNOSTIC_CHARACTERS + 50);
  const out = sanitizeSmokeDiagnostics(long);
  assert.equal(out.length, MAX_SMOKE_DIAGNOSTIC_CHARACTERS);
  assert.equal(out, long.slice(-MAX_SMOKE_DIAGNOSTIC_CHARACTERS));
});

test('findLatestProductionSmokeStatusComment only trusts github-actions[bot] marker bodies', () => {
  const comments = [
    { id: 1, user: { login: 'alice' }, body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nnope` },
    { id: 2, user: { login: 'github-actions[bot]' }, body: 'unmarked' },
    { id: 3, user: { login: 'github-actions[bot]' }, body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nold` },
    { id: 9, user: { login: 'github-actions[bot]' }, body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nnewest` },
    { id: 4, user: { login: 'github-actions[bot]' }, body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nmiddle` },
  ];
  const latest = findLatestProductionSmokeStatusComment(comments);
  assert.equal(latest.id, 9);
  assert.equal(findLatestProductionSmokeStatusComment([]), null);
  assert.equal(findLatestProductionSmokeStatusComment(null), null);
});

test('buildProductionSmokeFailureBody requires sha + runUrl and embeds sanitized diagnostics', () => {
  assert.throws(() => buildProductionSmokeFailureBody({ runUrl: 'https://x' }), /sha is required/);
  assert.throws(() => buildProductionSmokeFailureBody({ sha: 'abc' }), /runUrl is required/);

  const body = buildProductionSmokeFailureBody({
    sha: 'deadbeef',
    runUrl: 'https://github.com/Fremont-Derby/fremontderby/actions/runs/1',
    diagnostics: 'boom ``` oops',
  });
  assert.ok(body.startsWith(`${PRODUCTION_SMOKE_STATUS_MARKER}\n`));
  assert.match(body, /deadbeef/);
  assert.match(body, /actions\/runs\/1/);
  assert.match(body, /versionTag/);
  assert.match(body, /production/);
  assert.ok(!body.includes('```oops'));
});
