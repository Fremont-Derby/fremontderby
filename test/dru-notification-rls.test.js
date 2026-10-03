import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('DRU notification reads stay on the Worker', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261003043000_dru_notification_rls.sql', import.meta.url), 'utf8');
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on table dru\.user_notifications from public, anon, authenticated/);
  assert.match(sql, /grant select, insert, update on table dru\.user_notifications to service_role/);
  assert.doesNotMatch(sql, /grant select on table dru\.user_notifications to anon/);
});
