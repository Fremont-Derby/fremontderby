import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLabelSyncPlan } from '../scripts/collaboration-labels.mjs';

test('buildLabelSyncPlan creates missing labels', () => {
  const desired = [{ name: 'agent:dru', color: 'abcdef', description: 'DRU' }];
  const plan = buildLabelSyncPlan(desired, []);
  assert.equal(plan.create.length, 1);
  assert.equal(plan.update.length, 0);
  assert.equal(plan.create[0].name, 'agent:dru');
});

test('buildLabelSyncPlan updates color or description drift', () => {
  const desired = [{ name: 'agent:dru', color: 'abcdef', description: 'DRU' }];
  const existing = [{ name: 'agent:dru', color: '000000', description: 'old' }];
  const plan = buildLabelSyncPlan(desired, existing);
  assert.equal(plan.create.length, 0);
  assert.equal(plan.update.length, 1);
  assert.equal(plan.update[0].currentName, 'agent:dru');
  assert.equal(plan.update[0].color, 'abcdef');
});

test('buildLabelSyncPlan is stable when labels match', () => {
  const desired = [{ name: 'agent:dru', color: 'abcdef', description: 'DRU' }];
  const existing = [{ name: 'agent:dru', color: 'ABCDEF', description: 'DRU' }];
  const plan = buildLabelSyncPlan(desired, existing);
  assert.equal(plan.create.length, 0);
  assert.equal(plan.update.length, 0);
});
