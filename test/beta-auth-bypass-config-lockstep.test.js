import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync('wrangler.jsonc', 'utf8');
  return JSON.parse(raw.replace(/\/\/.*$/gm, ''));
}

test('jfl dru gamma set BETA_AUTH_BYPASS=1', () => {
  const cfg = loadWrangler();
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(cfg.env[lane].vars.BETA_AUTH_BYPASS, '1', lane);
    assert.match(cfg.env[lane].vars.BETA_ACTOR_EMAIL, new RegExp(`^${lane}-actor@fremontderby\\.com$`));
  }
});

test('production does not set BETA_AUTH_BYPASS', () => {
  const cfg = loadWrangler();
  assert.equal(cfg.vars.BETA_AUTH_BYPASS, undefined);
});
