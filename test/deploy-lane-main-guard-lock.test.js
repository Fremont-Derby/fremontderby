import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/deploy-lane.mjs', import.meta.url), 'utf8');

test('deploy-lane references FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN allow flag', () => {
  assert.match(source, /FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN/);
  assert.match(source, /=== '1'/);
});
