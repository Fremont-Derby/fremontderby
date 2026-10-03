import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { druOverrideSecretPlan, assertPreservedServiceRole } from '../src/druSecretCleanup.js';
import { classifyTimeoutManagerWindow } from '../src/timeoutManagerDiagnosis.js';

test('DRU notifications are not granted to anonymous clients', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261003043000_dru_notification_rls.sql', import.meta.url), 'utf8');
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on table dru\.user_notifications from public, anon, authenticated/);
  assert.match(sql, /grant select, insert, update on table dru\.user_notifications to service_role/);
  assert.equal(sql.includes('grant select on table dru.user_notifications to anon'), false);
});

test('DRU admin phone save stays private and fail-closed', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261003043100_dru_admin_phone.sql', import.meta.url), 'utf8');
  assert.match(sql, /dru\.set_admin_player_phone/);
  assert.match(sql, /hasPhone/);
  assert.equal(sql.includes('after_state, profile_phone'), false);
  assert.match(sql, /revoke all on function dru\.set_admin_player_phone\(uuid, uuid, text\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function dru\.set_admin_player_phone\(uuid, uuid, text\) to service_role/);
});

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
