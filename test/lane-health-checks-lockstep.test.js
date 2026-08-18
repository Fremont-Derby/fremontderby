import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_HEALTH_CHECKS } from '../scripts/assert-lane-health.mjs';

test('LANE_HEALTH_CHECKS covers production apex/www and permanent lanes', () => {
  assert.equal(Object.isFrozen(LANE_HEALTH_CHECKS), true);
  const byHost = Object.fromEntries(LANE_HEALTH_CHECKS.map((c) => [c.host, c.expect]));
  assert.equal(byHost['fremontderby.com'], 'production');
  assert.equal(byHost['www.fremontderby.com'], 'production');
  assert.equal(byHost['dru.fremontderby.com'], 'dru');
  assert.equal(byHost['jfl.fremontderby.com'], 'jfl');
  assert.equal(byHost['gamma.fremontderby.com'], 'gamma');
});
