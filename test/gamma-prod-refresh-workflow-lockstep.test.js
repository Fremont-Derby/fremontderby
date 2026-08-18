import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('gamma-prod-refresh is schedule/dispatch only and defaults dry-run', () => {
  const yml = readFileSync('.github/workflows/gamma-prod-refresh.yml', 'utf8');
  assert.match(yml, /cron: '15 10 \* \* \*'/);
  assert.match(yml, /workflow_dispatch:/);
  assert.doesNotMatch(yml, /pull_request:/);
  assert.match(yml, /default: '0'/);
  assert.match(yml, /gamma-prod-refresh\.mjs/);
  assert.match(yml, /cancel-in-progress: false/);
});
