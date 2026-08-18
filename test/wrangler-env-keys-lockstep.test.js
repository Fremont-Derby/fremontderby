import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync('wrangler.jsonc', 'utf8');
  // strip simple // comments if any; file is JSONC-ish but mostly JSON
  return JSON.parse(raw.replace(/\/\/.*$/gm, ''));
}

test('wrangler env has jfl, dru, gamma, staging', () => {
  const cfg = loadWrangler();
  const keys = Object.keys(cfg.env || {}).sort();
  assert.deepEqual(keys, ['dru', 'gamma', 'jfl', 'staging']);
});

test('lane envs set ENVIRONMENT and custom_domain routes', () => {
  const cfg = loadWrangler();
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(cfg.env[lane].vars.ENVIRONMENT, lane);
    assert.equal(cfg.env[lane].name, `fremontderby-${lane}`);
    const routes = cfg.env[lane].routes || [];
    assert.ok(routes.some((r) => r.pattern === `${lane}.fremontderby.com` && r.custom_domain === true));
  }
});

test('production top-level ENVIRONMENT is production', () => {
  const cfg = loadWrangler();
  assert.equal(cfg.vars.ENVIRONMENT, 'production');
  assert.equal(cfg.main, 'src/routerEntry.js');
});
