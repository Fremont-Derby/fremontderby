import test from 'node:test';
import assert from 'node:assert/strict';
import { CANARY_HOSTS } from '../scripts/public-surface-contract.mjs';

test('CANARY_HOSTS is frozen and has five entries', () => {
  assert.equal(Object.isFrozen(CANARY_HOSTS), true);
  assert.equal(CANARY_HOSTS.length, 5);
});

test('CANARY_HOSTS names and expectEnv lockstep with public hosts', () => {
  const byName = Object.fromEntries(CANARY_HOSTS.map((h) => [h.name, h]));
  assert.equal(byName.production.expectEnv, 'production');
  assert.equal(byName.www.expectEnv, 'production');
  assert.equal(byName.gamma.expectEnv, 'gamma');
  assert.equal(byName.dru.expectEnv, 'dru');
  assert.equal(byName.jfl.expectEnv, 'jfl');
  assert.equal(byName.production.base, 'https://fremontderby.com');
  assert.equal(byName.dru.base, 'https://dru.fremontderby.com');
});
