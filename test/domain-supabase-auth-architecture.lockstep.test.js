import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  LANE_CUSTOM_DOMAINS,
  assertWranglerRoutesCoverDomains,
} from '../scripts/lane-custom-domains.mjs';
import { PRODUCTION_DNS_HOSTS } from '../scripts/assert-production-dns.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseJsonc(text) {
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return JSON.parse(stripped);
}

test('LANE_CUSTOM_DOMAINS inventory covers apex + www + three lanes', () => {
  const byHost = Object.fromEntries(LANE_CUSTOM_DOMAINS.map((r) => [r.hostname, r]));
  assert.equal(byHost['fremontderby.com'].env, 'production');
  assert.equal(byHost['fremontderby.com'].service, 'fremontderby');
  assert.equal(byHost['www.fremontderby.com'].env, 'production');
  assert.equal(byHost['dru.fremontderby.com'].env, 'dru');
  assert.equal(byHost['jfl.fremontderby.com'].env, 'jfl');
  assert.equal(byHost['gamma.fremontderby.com'].env, 'gamma');
  assert.equal(LANE_CUSTOM_DOMAINS.length, 5);
});

test('LANE_CUSTOM_DOMAINS env matches HOST_ENVIRONMENT_EXPECTATIONS', () => {
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.equal(
      HOST_ENVIRONMENT_EXPECTATIONS[row.hostname],
      row.env,
      `${row.hostname} domain map must match host-environment expectations`,
    );
  }
});

test('PRODUCTION_DNS_HOSTS is apex + www only', () => {
  assert.deepEqual([...PRODUCTION_DNS_HOSTS], ['fremontderby.com', 'www.fremontderby.com']);
});

test('wrangler routes cover every LANE_CUSTOM_DOMAINS entry', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(assertWranglerRoutesCoverDomains(cfg), true);
});

test('production and lane Supabase project refs stay isolated', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  const prodRef = cfg.vars?.EXPECTED_SUPABASE_PROJECT_REF;
  assert.ok(prodRef, 'production EXPECTED_SUPABASE_PROJECT_REF required');
  assert.ok(
    String(cfg.vars?.SUPABASE_URL || '').includes(prodRef),
    'production SUPABASE_URL must match production project ref',
  );

  for (const lane of ['jfl', 'dru', 'gamma', 'staging']) {
    const env = cfg.env?.[lane];
    assert.ok(env, `env.${lane} required`);
    const laneRef = env.vars?.EXPECTED_SUPABASE_PROJECT_REF;
    assert.ok(laneRef, `${lane} EXPECTED_SUPABASE_PROJECT_REF required`);
    assert.notEqual(laneRef, prodRef, `${lane} must not share production Supabase project`);
    assert.ok(
      String(env.vars?.SUPABASE_URL || '').includes(laneRef),
      `${lane} SUPABASE_URL must match its project ref`,
    );
  }
});

test('BETA_AUTH_BYPASS is lane-only in wrangler; production must not declare it', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(
    cfg.vars?.BETA_AUTH_BYPASS,
    undefined,
    'production vars must not set BETA_AUTH_BYPASS',
  );
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(
      cfg.env[lane].vars?.BETA_AUTH_BYPASS,
      '1',
      `${lane} must enable BETA_AUTH_BYPASS`,
    );
    assert.equal(
      cfg.env[lane].vars?.ENVIRONMENT,
      lane,
      `${lane} ENVIRONMENT var must match lane name`,
    );
  }
});
