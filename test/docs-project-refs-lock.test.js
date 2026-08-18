import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRODUCTION_PROJECT_REF } from '../scripts/gamma-refresh/preflight.mjs';

const docs = readFileSync(new URL('../docs/ENVIRONMENTS.md', import.meta.url), 'utf8');

test('ENVIRONMENTS.md documents production project ref', () => {
  assert.ok(docs.includes(PRODUCTION_PROJECT_REF));
  assert.ok(docs.includes(`https://${PRODUCTION_PROJECT_REF}.supabase.co`));
});

test('ENVIRONMENTS.md describes shared staging project + lane schemas', () => {
  assert.match(docs, /shared staging Supabase project/i);
  assert.match(docs, /isolated `jfl` schema/i);
  assert.match(docs, /isolated `dru` schema/i);
  assert.match(docs, /isolated `gamma` schema/i);
});
