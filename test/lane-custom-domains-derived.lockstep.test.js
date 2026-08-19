import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';
import {
  LANE_CUSTOM_DOMAINS,
  workerServiceForEnvironment,
  domainsForEnv,
  assertWranglerRoutesCoverDomains,
} from '../scripts/lane-custom-domains.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseJsonc(text) {
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return JSON.parse(stripped);
}

test('workerServiceForEnvironment maps production and lanes', () => {
  assert.equal(workerServiceForEnvironment('production'), 'fremontderby');
  assert.equal(workerServiceForEnvironment('jfl'), 'fremontderby-jfl');
  assert.equal(workerServiceForEnvironment('dru'), 'fremontderby-dru');
  assert.equal(workerServiceForEnvironment('gamma'), 'fremontderby-gamma');
});

test('LANE_CUSTOM_DOMAINS is 1:1 with HOST_ENVIRONMENT_EXPECTATIONS', () => {
  assert.equal(LANE_CUSTOM_DOMAINS.length, Object.keys(HOST_ENVIRONMENT_EXPECTATIONS).length);
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.equal(row.env, HOST_ENVIRONMENT_EXPECTATIONS[row.hostname]);
    assert.equal(row.service, workerServiceForEnvironment(row.env));
  }
  assert.equal(domainsForEnv('production').length, 2);
  assert.equal(domainsForEnv('jfl').length, 1);
  assert.equal(domainsForEnv('jfl')[0].hostname, 'jfl.fremontderby.com');
});

test('derived domains still cover wrangler custom_domain routes', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(assertWranglerRoutesCoverDomains(cfg), true);
});
