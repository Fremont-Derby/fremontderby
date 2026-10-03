import assert from 'node:assert/strict';
import test from 'node:test';
import { druOverrideSecretPlan, assertPreservedServiceRole } from '../src/druSecretCleanup.js';
import { classifyTimeoutManagerWindow } from '../src/timeoutManagerDiagnosis.js';

test('obsolete DRU override secrets are the only names eligible for deletion', () => {
  const gamma = druOverrideSecretPlan(['SUPABASE_URL'], { ENVIRONMENT: 'gamma' });
  assert.equal(gamma.text, 'Secret cleanup runs on DRU only.');
  const plan = druOverrideSecretPlan(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OTHER'], { ENVIRONMENT: 'dru' });
  assert.equal(plan.text, 'Obsolete DRU override secrets can be removed.');
  assert.deepEqual(plan.delete, ['SUPABASE_URL']);
  assert.equal(assertPreservedServiceRole(plan), true);
  const closed = druOverrideSecretPlan(null, { ENVIRONMENT: 'dru' });
  assert.equal(closed.text, 'Secret cleanup failed closed.');
});

test('a timeout-manager kill with no league request is not a product defect', () => {
  const quiet = classifyTimeoutManagerWindow({ events: [{ kind: 'timeout-manager' }], requestPaths: ['/health'] });
  assert.equal(quiet.text, 'No Fremont Derby request is affected.');
  const hit = classifyTimeoutManagerWindow({ events: [{ kind: 'timeout-manager' }], requestPaths: ['/api/seasons'] });
  assert.equal(hit.text, 'A Fremont Derby request overlaps a timeout-manager kill.');
});
