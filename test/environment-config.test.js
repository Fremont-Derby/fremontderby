import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const json = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(json);
}

const config = loadWrangler();

test('production and staging expose isolated public Supabase browser config', () => {
  assert.ok(config.vars.SUPABASE_URL);
  assert.ok(config.vars.SUPABASE_PUBLISHABLE_KEY);
  assert.ok(config.vars.EXPECTED_SUPABASE_PROJECT_REF);
  assert.ok(config.env.staging.vars.SUPABASE_URL);
});

test('Wrangler owns every public release hostname as a custom domain', () => {
  const patterns = [
    ...(config.routes || []).map((r) => r.pattern),
    ...Object.values(config.env || {}).flatMap((env) => (env.routes || []).map((r) => r.pattern)),
  ];
  for (const host of [
    'fremontderby.com',
    'www.fremontderby.com',
    'jfl.fremontderby.com',
    'dru.fremontderby.com',
    'gamma.fremontderby.com',
  ]) {
    assert.ok(patterns.includes(host), host);
  }
});

test('workers.dev and preview URLs stay disabled for every Wrangler environment', () => {
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  for (const lane of Object.values(config.env || {})) {
    assert.equal(lane.workers_dev, false);
    assert.equal(lane.preview_urls, false);
  }
});

test('each deployable Derby lane binds version metadata for exact SHA verification', () => {
  assert.ok(config.version_metadata?.binding);
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.ok(config.env[lane].version_metadata?.binding);
  }
});

test('release lanes have explicit Derby identities and no legacy generic beta environment', () => {
  assert.equal(config.env.jfl.name, 'fremontderby-jfl');
  assert.equal(config.env.dru.name, 'fremontderby-dru');
  assert.equal(config.env.gamma.name, 'fremontderby-gamma');
  assert.equal(config.env.jfl.vars.ENVIRONMENT, 'jfl');
  assert.equal(config.env.dru.vars.ENVIRONMENT, 'dru');
  assert.equal(config.env.gamma.vars.ENVIRONMENT, 'gamma');
  assert.equal(config.env.beta, undefined);
});

test('non-production lane credentials are declared as required secrets, not placeholders', () => {
  for (const lane of ['jfl', 'dru', 'gamma']) {
    const target = config.env[lane];
    assert.ok(target.secrets.required.includes('SUPABASE_SERVICE_ROLE_KEY'));
    // Browser-safe + project identity remain committed vars; only the service role is secret.
    assert.ok(target.vars.SUPABASE_URL);
    assert.ok(target.vars.SUPABASE_PUBLISHABLE_KEY);
    assert.ok(target.vars.EXPECTED_SUPABASE_PROJECT_REF);
    assert.doesNotMatch(JSON.stringify(target), /REPLACE_|SET_ME|placeholder/i);
  }
});

test('auth bypass is enabled only in the isolated JFL and DRU lane config', () => {
  assert.equal(config.env.jfl.vars.BETA_AUTH_BYPASS, '1');
  assert.equal(config.env.dru.vars.BETA_AUTH_BYPASS, '1');
  assert.equal(config.env.gamma.vars.BETA_AUTH_BYPASS, '0');
  assert.equal(config.vars.BETA_AUTH_BYPASS, undefined);
  assert.equal(config.env.staging.vars.BETA_AUTH_BYPASS, undefined);
});
