import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('bind-jfl-staging-supabase targets staging project oqkkvqkerusepyokzbmt', () => {
  const source = readFileSync('scripts/bind-jfl-staging-supabase.mjs', 'utf8');
  assert.match(source, /oqkkvqkerusepyokzbmt/);
  assert.match(source, /--env', 'jfl'/);
  assert.match(source, /jfl\.fremontderby\.com\/health\/environment/);
  assert.match(source, /classic secret put/);
});
