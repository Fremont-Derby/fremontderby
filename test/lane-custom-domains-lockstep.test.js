import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_CUSTOM_DOMAINS, domainsForEnv } from '../scripts/lane-custom-domains.mjs';

test('LANE_CUSTOM_DOMAINS is frozen and has five entries', () => {
  assert.equal(Object.isFrozen(LANE_CUSTOM_DOMAINS), true);
  assert.equal(LANE_CUSTOM_DOMAINS.length, 5);
});

test('LANE_CUSTOM_DOMAINS maps hostnames to correct services and envs', () => {
  const byHost = Object.fromEntries(LANE_CUSTOM_DOMAINS.map((r) => [r.hostname, r]));
  assert.equal(byHost['fremontderby.com'].service, 'fremontderby');
  assert.equal(byHost['fremontderby.com'].env, 'production');
  assert.equal(byHost['www.fremontderby.com'].env, 'production');
  assert.equal(byHost['dru.fremontderby.com'].service, 'fremontderby-dru');
  assert.equal(byHost['dru.fremontderby.com'].env, 'dru');
  assert.equal(byHost['jfl.fremontderby.com'].service, 'fremontderby-jfl');
  assert.equal(byHost['jfl.fremontderby.com'].env, 'jfl');
  assert.equal(byHost['gamma.fremontderby.com'].service, 'fremontderby-gamma');
  assert.equal(byHost['gamma.fremontderby.com'].env, 'gamma');
});

test('domainsForEnv returns only matching lane rows', () => {
  assert.equal(domainsForEnv('dru').length, 1);
  assert.equal(domainsForEnv('dru')[0].hostname, 'dru.fremontderby.com');
  assert.equal(domainsForEnv('production').length, 2);
});
