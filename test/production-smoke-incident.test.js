import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  MAX_SMOKE_DIAGNOSTIC_CHARACTERS,
  PRODUCTION_SMOKE_STATUS_MARKER,
  buildProductionSmokeFailureBody,
  findLatestProductionSmokeStatusComment,
  sanitizeSmokeDiagnostics,
} from '../scripts/production-smoke-incident.mjs';

test('selects the latest marker-owned GitHub Actions status comment', () => {
  const latest = findLatestProductionSmokeStatusComment([
    {
      id: 10,
      body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nOlder status`,
      user: { login: 'github-actions[bot]' },
    },
    {
      id: 12,
      body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nLatest status`,
      user: { login: 'github-actions[bot]' },
    },
    {
      id: 11,
      body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nHuman note quoting the marker`,
      user: { login: 'subiki' },
    },
  ]);

  assert.equal(latest?.id, 12);
});

test('ignores unrelated bot comments and human comments containing the marker', () => {
  const latest = findLatestProductionSmokeStatusComment([
    {
      id: 20,
      body: 'Unrelated workflow note',
      user: { login: 'github-actions[bot]' },
    },
    {
      id: 21,
      body: `Context before ${PRODUCTION_SMOKE_STATUS_MARKER}`,
      user: { login: 'github-actions[bot]' },
    },
    {
      id: 22,
      body: `${PRODUCTION_SMOKE_STATUS_MARKER}\nHuman-authored incident note`,
      user: { login: 'subiki' },
    },
  ]);

  assert.equal(latest, null);
});

test('sanitizes fenced diagnostics and bounds the retained tail', () => {
  const diagnostics = `${'x'.repeat(MAX_SMOKE_DIAGNOSTIC_CHARACTERS + 50)}\n\`\`\`unsafe`;
  const sanitized = sanitizeSmokeDiagnostics(diagnostics);

  assert.ok(sanitized.length <= MAX_SMOKE_DIAGNOSTIC_CHARACTERS);
  assert.equal(sanitized.includes('```'), false);
  assert.ok(sanitized.endsWith('``\u200b`unsafe'));
});

test('builds a current, marker-owned failure status without exposing raw fences', () => {
  const body = buildProductionSmokeFailureBody({
    sha: 'abc123',
    runUrl: 'https://github.com/subiki/fremontderby/actions/runs/123',
    diagnostics: 'Cloudflare returned ```challenge```.',
  });

  assert.ok(body.startsWith(`${PRODUCTION_SMOKE_STATUS_MARKER}\n`));
  assert.match(body, /main commit `abc123`/);
  assert.match(body, /actions\/runs\/123/);
  assert.match(body, /\/health\/environment/);
  assert.match(body, /maintained automatically/);
  assert.equal(body.includes('```challenge```'), false);
});

test('CI upserts the status comment and still fails the release gate', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');

  assert.match(workflow, /group: production-smoke-main/);
  assert.match(workflow, /github\.paginate\(github\.rest\.issues\.listComments/);
  assert.match(workflow, /findLatestProductionSmokeStatusComment\(comments\)/);
  assert.match(workflow, /github\.rest\.issues\.updateComment/);
  assert.match(workflow, /github\.rest\.issues\.createComment/);
  assert.match(workflow, /name: Fail release validation\n\s+if: steps\.smoke\.outcome == 'failure'\n\s+run: exit 1/);
});
