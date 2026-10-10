import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('shared staging exposes lane private schemas to PostgREST', () => {
  const src = readFileSync(new URL('../src/supabaseSchema.js', import.meta.url), 'utf8');
  assert.match(src, /expectedSupabaseSchema/);
});
