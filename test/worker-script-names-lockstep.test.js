import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScriptNames } from '../scripts/disable-workers-dev.mjs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

test('workerScriptNames includes every LANE_CUSTOM_DOMAINS service', () => {
  const set = new Set(workerScriptNames);
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.ok(set.has(row.service), row.service);
  }
});

test('workerScriptNames includes known legacy production/staging script names', () => {
  const set = new Set(workerScriptNames);
  assert.ok(set.has('fremontderby-prod'));
  assert.ok(set.has('fremontderby-staging'));
});

test('workerScriptNames has no duplicates', () => {
  assert.equal(workerScriptNames.length, new Set(workerScriptNames).size);
});
