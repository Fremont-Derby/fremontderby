import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertNotificationWorkerGrant } from '../src/druNotificationAccess.js';

test('DRU notification reads stay on the Worker', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261003043000_dru_notification_rls.sql', import.meta.url), 'utf8');
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on table dru\.user_notifications from public, anon, authenticated/);
  assert.match(sql, /grant select, insert, update on table dru\.user_notifications to service_role/);
  assert.doesNotMatch(sql, /grant select on table dru\.user_notifications to anon/);
  assert.match(sql, /dru_notifications_browser_deny/);
  assert.match(sql, /with check \(false\)/);
});

test('both DRU notification migrations meet the Worker contract', () => {
  for (const file of [
    '../supabase/migrations/20261003043000_dru_notification_rls.sql',
    '../supabase/migrations/20261003113000_dru_notification_no_browser_policy.sql',
  ]) {
    assert.equal(typeof assertNotificationWorkerGrant(readFileSync(new URL(file, import.meta.url), 'utf8')), 'string');
  }
});
