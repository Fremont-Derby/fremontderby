import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(
  fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
);

const publicHosts = {
  production: 'fremontderby.com',
  jfl: 'jfl.fremontderby.com',
  dru: 'dru.fremontderby.com',
  gamma: 'gamma.fremontderby.com',
};

function customDomainFor(environment) {
  const target = environment === 'production' ? config : config.env[environment];
  return target.routes?.find((route) => route.custom_domain === true)?.pattern;
}

test('production and staging expose isolated public Supabase browser config', () => {
  assert.equal(config.vars.ENVIRONMENT, 'production');
  assert.match(config.vars.SUPABASE_URL, /cpiucsxlkicmlbvdvhww\.supabase\.co$/);
  assert.match(config.vars.SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_/);
  assert.equal(config.vars.EXPECTED_SUPABASE_PROJECT_REF, 'cpiucsxlkicmlbvdvhww');

  const staging = config.env.staging.vars;
  assert.equal(staging.ENVIRONMENT, 'staging');
  assert.match(staging.SUPABASE_URL, /oqkkvqkerusepyokzbmt\.supabase\.co$/);
  assert.match(staging.SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_/);
  assert.equal(staging.EXPECTED_SUPABASE_PROJECT_REF, 'oqkkvqkerusepyokzbmt');

  assert.notEqual(config.vars.SUPABASE_URL, staging.SUPABASE_URL);
  assert.notEqual(config.vars.SUPABASE_PUBLISHABLE_KEY, staging.SUPABASE_PUBLISHABLE_KEY);
  assert.equal('SUPABASE_SERVICE_ROLE_KEY' in config.vars, false);
  assert.equal('SUPABASE_SERVICE_ROLE_KEY' in staging, false);
});

test('Wrangler owns every public release hostname as a custom domain', () => {
  for (const [environment, host] of Object.entries(publicHosts)) {
    assert.equal(customDomainFor(environment), host);
  }
});

test('workers.dev and preview URLs stay disabled for every Wrangler environment', () => {
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);

  for (const [environment, target] of Object.entries(config.env)) {
    assert.equal(
      target.workers_dev ?? config.workers_dev,
      false,
      `${environment} must not expose a workers.dev route`,
    );
    assert.equal(
      target.preview_urls ?? config.preview_urls,
      false,
      `${environment} must not expose Worker preview URLs`,
    );
  }
});

test('each deployable Derby lane binds version metadata for exact SHA verification', () => {
  assert.equal(config.version_metadata.binding, 'CF_VERSION_METADATA');
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(config.env[lane].version_metadata?.binding, 'CF_VERSION_METADATA');
  }
});

test('release lanes have explicit Derby identities and no legacy generic beta environment', () => {
  assert.equal(config.env.beta, undefined);
  assert.equal(config.env['beta-jfl'], undefined);
  assert.equal(config.env['beta-dru'], undefined);
  assert.equal(config.env.jfl.name, 'fremontderby-jfl');
  assert.equal(config.env.dru.name, 'fremontderby-dru');
  assert.equal(config.env.gamma.name, 'fremontderby-gamma');
  assert.equal(config.env.jfl.vars.ENVIRONMENT, 'jfl');
  assert.equal(config.env.dru.vars.ENVIRONMENT, 'dru');
  assert.equal(config.env.gamma.vars.ENVIRONMENT, 'gamma');
});

test('non-production lane credentials are declared as required secrets, not placeholders', () => {
  for (const lane of ['jfl', 'dru', 'gamma']) {
    const target = config.env[lane];
    assert.ok(target.secrets.required.includes('SUPABASE_SERVICE_ROLE_KEY'));
    assert.ok(target.vars.SUPABASE_URL);
    assert.ok(target.vars.SUPABASE_PUBLISHABLE_KEY);
    assert.ok(target.vars.EXPECTED_SUPABASE_PROJECT_REF);
    assert.doesNotMatch(JSON.stringify(target), /REPLACE_|SET_ME|placeholder/i);
  }
});

test('auth bypass is enabled only in the isolated JFL and DRU lane config', () => {
  assert.equal(config.env.jfl.vars.BETA_AUTH_BYPASS, '1');
  assert.equal(config.env.dru.vars.BETA_AUTH_BYPASS, '1');
  assert.equal(config.env.gamma.vars.BETA_AUTH_BYPASS, '1');
  assert.equal(config.vars.BETA_AUTH_BYPASS, undefined);
  assert.equal(config.env.staging.vars.BETA_AUTH_BYPASS, undefined);
});
