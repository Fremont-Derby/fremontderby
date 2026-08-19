import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readWorkflow(name) {
  const path = join(root, '.github/workflows', name);
  assert.ok(existsSync(path), `${name} must exist`);
  return readFileSync(path, 'utf8');
}

function parseJsonc(text) {
  // Strip // line comments and /* */ blocks enough for this config.
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return JSON.parse(stripped);
}

test('fix-jfl-supabase-bindings workflow invokes bind-jfl-staging-supabase', () => {
  const src = readWorkflow('fix-jfl-supabase-bindings.yml');
  assert.ok(src.includes('name: Fix JFL Supabase bindings'));
  assert.ok(src.includes('workflow_dispatch:'));
  assert.ok(src.includes('node scripts/bind-jfl-staging-supabase.mjs'));
  assert.ok(existsSync(join(root, 'scripts/bind-jfl-staging-supabase.mjs')));
});

test('enforce-workers-dev-disabled workflow invokes disable-workers-dev', () => {
  const src = readWorkflow('enforce-workers-dev-disabled.yml');
  assert.ok(src.includes('name: Enforce workers.dev disabled'));
  assert.ok(src.includes('workflow_dispatch:'));
  assert.ok(src.includes('node scripts/disable-workers-dev.mjs'));
  assert.ok(existsSync(join(root, 'scripts/disable-workers-dev.mjs')));
});

test('restore-lane-custom-domains workflow restores then re-diagnoses and asserts DNS', () => {
  const src = readWorkflow('restore-lane-custom-domains.yml');
  assert.ok(src.includes('name: Restore lane custom domains'));
  assert.ok(src.includes('workflow_dispatch:'));
  assert.ok(src.includes('node scripts/restore-lane-custom-domains.mjs'));
  assert.ok(src.includes('node scripts/diagnose-worker-domains.mjs'));
  assert.ok(src.includes('node scripts/assert-production-dns.mjs'));
  assert.ok(existsSync(join(root, 'scripts/restore-lane-custom-domains.mjs')));
});

test('wrangler top-level and every env keep workers_dev and preview_urls false', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(cfg.workers_dev, false, 'top-level workers_dev must be false');
  assert.equal(cfg.preview_urls, false, 'top-level preview_urls must be false');

  const envs = cfg.env || {};
  const expectedEnvKeys = ['staging', 'jfl', 'dru', 'gamma'];
  for (const key of expectedEnvKeys) {
    assert.ok(envs[key], `wrangler env.${key} must exist`);
    assert.equal(envs[key].workers_dev, false, `env.${key}.workers_dev must be false`);
    assert.equal(envs[key].preview_urls, false, `env.${key}.preview_urls must be false`);
  }
});

test('wrangler lane envs bind custom domains and expected ENVIRONMENT vars', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  const lanes = {
    jfl: 'jfl.fremontderby.com',
    dru: 'dru.fremontderby.com',
    gamma: 'gamma.fremontderby.com',
  };
  for (const [lane, hostname] of Object.entries(lanes)) {
    const env = cfg.env[lane];
    assert.equal(env.vars?.ENVIRONMENT, lane);
    const patterns = (env.routes || []).map((r) => r.pattern);
    assert.ok(patterns.includes(hostname), `${lane} must route ${hostname}`);
  }
});
