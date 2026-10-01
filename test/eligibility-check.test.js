import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibilityCheck } from '../src/eligibilityCheck.js';
test('eligibility names the missing requirement', () => {
  assert.equal(eligibilityCheck({ paid: false, available: true }).reason, 'Payment is missing.');
  assert.equal(eligibilityCheck({ paid: true, available: true }).ok, true);
});
