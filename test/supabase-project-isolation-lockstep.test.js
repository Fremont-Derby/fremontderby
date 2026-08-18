import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync('wrangler.jsonc', 'utf8');
  return JSON.parse(raw.replace(/\/\/.*$/gm, ''));
}

test('production Supabase project differs from non-prod lanes', () => {
  const cfg = loadWrangler();
  const prodRef = cfg.vars.EXPECTED_SUPABASE_PROJECT_REF;
  const prodUrl = cfg.vars.SUPABASE_URL;
  assert.ok(prodRef);
  assert.ok(prodUrl.includes(prodRef));

  for (const lane of ['jfl', 'dru', 'gamma', 'staging']) {
    const laneRef = cfg.env[lane].vars.EXPECTED_SUPABASE_PROJECT_REF;
    assert.notEqual(laneRef, prodRef, lane);
    assert.ok(cfg.env[lane].vars.SUPABASE_URL.includes(laneRef), lane);
  }
});

test('jfl dru gamma share the same non-prod Supabase project', () => {
  const cfg = loadWrangler();
  const refs = ['jfl', 'dru', 'gamma'].map((l) => cfg.env[l].vars.EXPECTED_SUPABASE_PROJECT_REF);
  assert.equal(new Set(refs).size, 1);
});
