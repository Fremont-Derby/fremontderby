import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/fix-jfl-supabase-bindings.yml', import.meta.url),
  'utf8',
);

test('fix-jfl-supabase-bindings workflow has expected name', () => {
  assert.match(workflow, /^name:\s*Fix JFL Supabase bindings\s*$/m);
});
