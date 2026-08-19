import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_SMOKE_STATUS_MARKER,
  MAX_SMOKE_DIAGNOSTIC_CHARACTERS,
  sanitizeSmokeDiagnostics,
  findLatestProductionSmokeStatusComment,
  buildProductionSmokeFailureBody,
} from '../scripts/production-smoke-incident.mjs';

test('sanitizeSmokeDiagnostics falls back and truncates with fence safety', () => {
  assert.equal(sanitizeSmokeDiagnostics(''), 'Smoke output was unavailable.');
  assert.equal(sanitizeSmokeDiagnostics(null), 'Smoke output was unavailable.');
  const fenced = sanitizeSmokeDiagnostics('bad ``` fence');
  assert.ok(!fenced.includes('```'));
  const long = 'x'.repeat(MAX_SMOKE_DIAGNOSTIC_CHARACTERS + 50);
  assert.equal(sanitizeSmokeDiagnostics(long).length, MAX_SMOKE_DIAGNOSTIC_CHARACTERS);
});

test('findLatestProductionSmokeStatusComment selects owned marker comment by max id', () => {
  const comments = [
    { id: 1, user: { login: 'github-actions[bot]' }, body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nold` },
    { id: 3, user: { login: 'human' }, body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nnope` },
    { id: 2, user: { login: 'github-actions[bot]' }, body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nnewer` },
    { id: 4, user: { login: 'github-actions[bot]' }, body: 'unrelated' },
  ];
  const found = findLatestProductionSmokeStatusComment(comments);
  assert.equal(found.id, 2);
  assert.equal(findLatestProductionSmokeStatusComment([]), null);
  assert.equal(findLatestProductionSmokeStatusComment(null), null);
});

test('buildProductionSmokeFailureBody requires sha/runUrl and embeds diagnostics', () => {
  assert.throws(() => buildProductionSmokeFailureBody({ runUrl: 'https://x' }), /sha is required/);
  assert.throws(() => buildProductionSmokeFailureBody({ sha: 'abc' }), /runUrl is required/);
  const body = buildProductionSmokeFailureBody({
    sha: 'deadbeef',
    runUrl: 'https://example.test/run/1',
    diagnostics: 'version lag',
  });
  assert.ok(body.startsWith(`${PRODUCTION_SMOKE_STATUS_MARKER}\n`));
  assert.match(body, /deadbeef/);
  assert.match(body, /https:\/\/example\.test\/run\/1/);
  assert.match(body, /version lag/);
  assert.match(body, /Try a League Night/);
});
