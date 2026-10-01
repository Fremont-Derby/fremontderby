import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(
  fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
);

const publicHosts = {
  jfl: 'jfl.fremontderby.com',
  dru: 'dru.fremontderby.com',
  gamma: 'gamma.fremontderby.com',
};

function customDomainFor(environment) {
  const target = config.env[environment];
  return target.routes?.find((route) => route.custom_domain === true)?.pattern;
}

function rootCustomDomain() {
  return config.routes?.find((route) => route.custom_domain === true)?.pattern;
}

test('DRU root Workers Build profile pins durable public bindings and keeps service role secret', () => {
  assert.equal(config.name, 'fremontderby-dru');
  assert.equal(config.vars.ENVIRONMENT, 'dru');
  assert.equal(config.vars.SUPABASE_SCHEMA, 'dru');
  assert.equal(rootCustomDomain(), 'dru.fremontderby.com');
  assert.equal(config.vars.SUPABASE_URL, 'https://oqkkvqkerusepyokzbmt.supabase.co');
  assert.match(config.vars.SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_/);
  assert.equal(config.vars.EXPECTED_SUPABASE_PROJECT_REF, 'oqkkvqkerusepyokzbmt');
  assert.equal('SUPABASE_SERVICE_ROLE_KEY' in config.vars, false);
  assert.ok(config.secrets.required.includes('SUPABASE_SERVICE_ROLE_KEY'));
  assert.ok(config.secrets.required.includes('BETA_ACTOR_USER_ID'));

  for (const name of [
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'EXPECTED_SUPABASE_PROJECT_REF',
  ]) {
    assert.equal(config.secrets.required.includes(name), false);
  }
});

test('DRU root Workers Build profile matches the explicit dru environment', () => {
  assert.equal(config.env.dru.name, config.name);
  assert.equal(customDomainFor('dru'), rootCustomDomain());
  assert.equal(config.env.dru.vars.ENVIRONMENT, config.vars.ENVIRONMENT);
  assert.equal(config.env.dru.vars.SUPABASE_SCHEMA, config.vars.SUPABASE_SCHEMA);
  assert.equal(config.env.dru.vars.SUPABASE_URL, config.vars.SUPABASE_URL);
  assert.equal(config.env.dru.vars.SUPABASE_PUBLISHABLE_KEY, config.vars.SUPABASE_PUBLISHABLE_KEY);
  assert.equal(config.env.dru.vars.EXPECTED_SUPABASE_PROJECT_REF, config.vars.EXPECTED_SUPABASE_PROJECT_REF);
  assert.equal(config.env.dru.vars.BETA_AUTH_BYPASS, config.vars.BETA_AUTH_BYPASS);
  assert.equal(config.env.dru.vars.BETA_ACTOR_EMAIL, config.vars.BETA_ACTOR_EMAIL);
  assert.ok(config.env.dru.secrets.required.includes('SUPABASE_SERVICE_ROLE_KEY'));
  assert.ok(config.env.dru.secrets.required.includes('BETA_ACTOR_USER_ID'));
  for (const name of [
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'EXPECTED_SUPABASE_PROJECT_REF',
  ]) {
    assert.equal(config.env.dru.secrets.required.includes(name), false);
  }
});

test('Wrangler retains explicit custom-domain identities for each named lane', () => {
  assert.equal(rootCustomDomain(), publicHosts.dru);
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

test('unrecovered JFL and Gamma Supabase credentials remain required secrets', () => {
  const common = [
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'EXPECTED_SUPABASE_PROJECT_REF',
  ];
  for (const lane of ['jfl', 'gamma']) {
    const target = config.env[lane];
    for (const name of common) assert.ok(target.secrets.required.includes(name));
    assert.doesNotMatch(JSON.stringify(target), /REPLACE_|SET_ME|placeholder/i);
  }
});

test('DRU actor id stays secret-backed (not hardcoded in root vars)', () => {
  assert.equal(config.vars.BETA_ACTOR_USER_ID, undefined);
  assert.ok(config.secrets.required.includes('BETA_ACTOR_USER_ID'));
  assert.ok(config.env.dru.secrets.required.includes('BETA_ACTOR_USER_ID'));
  assert.equal(config.env.dru.vars.BETA_ACTOR_USER_ID, undefined);
  assert.ok(config.env.jfl.secrets.required.includes('BETA_ACTOR_USER_ID'));
  assert.equal(config.env.gamma.secrets.required.includes('BETA_ACTOR_USER_ID'), false);
});

test('auth bypass is enabled for the DRU root deployment profile', () => {
  assert.equal(config.vars.BETA_AUTH_BYPASS, '1');
  assert.equal(config.env.jfl.vars.BETA_AUTH_BYPASS, '1');
  assert.equal(config.env.dru.vars.BETA_AUTH_BYPASS, '1');
  assert.equal(config.env.gamma.vars.BETA_AUTH_BYPASS, '0');
  assert.equal(config.env.staging.vars.BETA_AUTH_BYPASS, undefined);
});
