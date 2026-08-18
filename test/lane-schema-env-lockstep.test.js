import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync('wrangler.jsonc', 'utf8');
  return JSON.parse(raw.replace(/\/\/.*$/gm, ''));
}

test('lane ENVIRONMENT matches lane key and SUPABASE_SCHEMA', () => {
  const cfg = loadWrangler();
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(cfg.env[lane].vars.ENVIRONMENT, lane);
    assert.equal(cfg.env[lane].vars.SUPABASE_SCHEMA, lane);
    assert.equal(cfg.env[lane].name, `fremontderby-${lane}`);
  }
});

test('production ENVIRONMENT is production without SUPABASE_SCHEMA lane override', () => {
  const cfg = loadWrangler();
  assert.equal(cfg.vars.ENVIRONMENT, 'production');
  assert.equal(cfg.vars.SUPABASE_SCHEMA, undefined);
});
