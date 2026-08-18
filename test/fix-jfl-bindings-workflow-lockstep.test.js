import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('fix-jfl-supabase-bindings is workflow_dispatch only', () => {
  const yml = readFileSync('.github/workflows/fix-jfl-supabase-bindings.yml', 'utf8');
  assert.match(yml, /workflow_dispatch:/);
  assert.doesNotMatch(yml, /pull_request:/);
  assert.match(yml, /bind-jfl-staging-supabase\.mjs/);
  assert.match(yml, /cancel-in-progress: false/);
});
