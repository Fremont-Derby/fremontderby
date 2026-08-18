import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

test('LANE_CUSTOM_DOMAINS covers apex www and permanent lanes', () => {
  assert.equal(Object.isFrozen(LANE_CUSTOM_DOMAINS), true);
  const byHost = Object.fromEntries(LANE_CUSTOM_DOMAINS.map((r) => [r.hostname, r]));
  assert.equal(byHost['fremontderby.com'].env, 'production');
  assert.equal(byHost['www.fremontderby.com'].service, 'fremontderby');
  assert.equal(byHost['dru.fremontderby.com'].service, 'fremontderby-dru');
  assert.equal(byHost['jfl.fremontderby.com'].env, 'jfl');
  assert.equal(byHost['gamma.fremontderby.com'].env, 'gamma');
});
