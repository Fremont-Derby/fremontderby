import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  GAMMA_STAGING_PROJECT_REF,
  PRODUCTION_PROJECT_REF,
} from '../scripts/gamma-refresh/preflight.mjs';

const docs = readFileSync(new URL('../docs/ENVIRONMENTS.md', import.meta.url), 'utf8');

test('ENVIRONMENTS.md documents production and non-prod project refs', () => {
  assert.ok(docs.includes(PRODUCTION_PROJECT_REF));
  assert.ok(docs.includes(GAMMA_STAGING_PROJECT_REF));
  assert.ok(docs.includes(`https://${PRODUCTION_PROJECT_REF}.supabase.co`));
});
