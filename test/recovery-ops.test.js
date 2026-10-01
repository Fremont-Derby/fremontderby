import test from 'node:test';
import assert from 'node:assert/strict';
import { agingReview, hesitation, humanHelp, recoveryTargets, stableRead } from '../src/recoveryOps.js';

test('recovery names the point and the time', () => {
  assert.equal(recoveryTargets().time, '30 minutes');
});

test('hesitation counts repeated steps', () => {
  assert.equal(hesitation([{ kind: 'repeat' }, { kind: 'click' }]).count, 1);
});

test('a stuck task needs a person', () => {
  assert.equal(humanHelp({ stuck: true }).needed, true);
  assert.equal(humanHelp({}).needed, false);
});

test('aging review lists features unused for 90 days', () => {
  assert.deepEqual(agingReview([{ name: 'old', unusedDays: 120 }, { name: 'new', unusedDays: 2 }]), ['old']);
});

test('a stable read cannot write', () => {
  assert.equal(stableRead({ writes: true }).ok, false);
  assert.equal(stableRead({ writes: false }).ok, true);
});
