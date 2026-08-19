import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScriptNames } from '../scripts/disable-workers-dev.mjs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

test('workerScriptNames includes every LANE_CUSTOM_DOMAINS service', () => {
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.ok(
      workerScriptNames.includes(row.service),
      `${row.service} must be in workerScriptNames for workers.dev cleanup`,
    );
  }
});

test('workerScriptNames also covers legacy apex and staging scripts', () => {
  assert.ok(workerScriptNames.includes('fremontderby-prod'));
  assert.ok(workerScriptNames.includes('fremontderby-staging'));
  assert.ok(workerScriptNames.includes('fremontderby'));
});

test('workerScriptNames has no duplicates', () => {
  assert.equal(workerScriptNames.length, new Set(workerScriptNames).size);
});
