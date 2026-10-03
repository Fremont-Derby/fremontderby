import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('DRU notification policies do not leave a browser read', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261003113000_dru_notification_no_browser_policy.sql', import.meta.url), 'utf8');
  assert.match(sql, /drop policy if exists/);
  assert.match(sql, /revoke all on table dru\.user_notifications from public, anon, authenticated/);
  assert.match(sql, /grant select, insert, update on table dru\.user_notifications to service_role/);
  assert.match(sql, /force row level security/);
  assert.match(sql, /dru_notifications_browser_deny/);
  assert.match(sql, /user_notifications_id_seq/);
});
