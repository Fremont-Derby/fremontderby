import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLabelSyncPlan } from '../scripts/collaboration-labels.mjs';

test('buildLabelSyncPlan creates and updates labels', () => {
  const desired = [
    { name: 'agent:dru', color: '8250df', description: 'DRU owns' },
    { name: 'stage:ready', color: 'd4c5f9', description: 'ready' },
  ];
  const existing = [
    { name: 'agent:dru', color: '000000', description: 'old' },
  ];
  const plan = buildLabelSyncPlan(desired, existing);
  assert.equal(plan.create.length, 1);
  assert.equal(plan.create[0].name, 'stage:ready');
  assert.equal(plan.update.length, 1);
  assert.equal(plan.update[0].name, 'agent:dru');
});
