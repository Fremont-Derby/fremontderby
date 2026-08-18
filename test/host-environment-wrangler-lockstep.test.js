import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

function loadWranglerConfig() {
  const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  return JSON.parse(raw);
}

test('every HOST_ENVIRONMENT expectation maps to a wrangler environment', () => {
  const config = loadWranglerConfig();
  assert.equal(config.vars.ENVIRONMENT, 'production');

  for (const [host, env] of Object.entries(HOST_ENVIRONMENT_EXPECTATIONS)) {
    if (env === 'production') {
      assert.equal(config.vars.ENVIRONMENT, 'production', host);
      continue;
    }
    assert.ok(config.env?.[env], `${host} expects env "${env}" which is missing from wrangler.jsonc`);
    assert.equal(
      config.env[env].vars?.ENVIRONMENT,
      env,
      `${host}: wrangler env.${env}.vars.ENVIRONMENT`,
    );
  }
});

test('public release hosts cover production + jfl + dru + gamma', () => {
  const envs = new Set(Object.values(HOST_ENVIRONMENT_EXPECTATIONS));
  for (const required of ['production', 'jfl', 'dru', 'gamma']) {
    assert.ok(envs.has(required), required);
  }
});

test('lane worker names follow fremontderby-<env> convention', () => {
  const config = loadWranglerConfig();
  for (const env of ['jfl', 'dru', 'gamma']) {
    assert.equal(config.env[env].name, `fremontderby-${env}`);
  }
});
