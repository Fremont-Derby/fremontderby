import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  LANE_CUSTOM_DOMAINS,
  assertWranglerRoutesCoverDomains,
  domainsForEnv,
} from '../scripts/lane-custom-domains.mjs';
import { expectedHostnamesForLane } from '../scripts/deploy-lane.mjs';

function loadWrangler() {
  const path = join(dirname(fileURLToPath(import.meta.url)), '..', 'wrangler.jsonc');
  const raw = readFileSync(path, 'utf8');
  const json = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(json);
}

test('wrangler owns custom domains for every lane hostname (#639)', () => {
  assertWranglerRoutesCoverDomains(loadWrangler());
});

test('lane deploy maps env to dedicated hostname not production apex', () => {
  assert.deepEqual(expectedHostnamesForLane('dru'), ['dru.fremontderby.com']);
  assert.deepEqual(expectedHostnamesForLane('jfl'), ['jfl.fremontderby.com']);
  assert.deepEqual(expectedHostnamesForLane('gamma'), ['gamma.fremontderby.com']);
  assert.equal(domainsForEnv('dru')[0].service, 'fremontderby-dru');
  assert.ok(LANE_CUSTOM_DOMAINS.every((row) => row.hostname.includes('fremontderby.com')));
});
