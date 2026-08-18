import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync('wrangler.jsonc', 'utf8');
  return JSON.parse(raw.replace(/\/\/.*$/gm, ''));
}

test('top-level secrets.required is service-role only', () => {
  const cfg = loadWrangler();
  assert.deepEqual(cfg.secrets.required, ['SUPABASE_SERVICE_ROLE_KEY']);
});

test('lane secrets.required is service-role only', () => {
  const cfg = loadWrangler();
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.deepEqual(cfg.env[lane].secrets.required, ['SUPABASE_SERVICE_ROLE_KEY'], lane);
  }
});

test('publishable keys stay in vars not secrets', () => {
  const cfg = loadWrangler();
  assert.ok(cfg.vars.SUPABASE_PUBLISHABLE_KEY);
  assert.ok(!cfg.secrets.required.includes('SUPABASE_PUBLISHABLE_KEY'));
});
