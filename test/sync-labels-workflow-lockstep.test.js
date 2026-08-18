import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('sync-collaboration-labels validates then syncs', () => {
  const yml = readFileSync('.github/workflows/sync-collaboration-labels.yml', 'utf8');
  assert.match(yml, /workflow_dispatch:/);
  assert.match(yml, /npm run labels:check/);
  assert.match(yml, /collaboration-labels\.mjs --sync/);
});
