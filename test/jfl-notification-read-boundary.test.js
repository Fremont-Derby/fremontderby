import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../supabase/migrations/20261001012039_jfl_notification_read_boundary.sql', import.meta.url), 'utf8');

test('JFL notification migration fails closed on inspected table and RPC baselines', () => {
  assert.match(sql, /n\.nspname = 'jfl'/);
  assert.match(sql, /c\.relname = 'user_notifications'/);
  assert.match(sql, /not c\.relrowsecurity/);
  assert.match(sql, /c\.relacl::text = /);
  assert.match(sql, /md5\(p\.prosrc\) = expected\.body_md5/);
  assert.match(sql, /raise exception 'JFL notification RPC baseline changed'/);
});

test('JFL notification migration removes public table and actor-spoofable RPC access', () => {
  assert.match(sql, /alter table jfl\.user_notifications enable row level security;/);
  assert.match(sql, /revoke select on table jfl\.user_notifications from anon, authenticated;/);
  for (const name of [
    'admin_broadcast_notification',
    'create_user_notification',
    'list_my_notifications',
    'mark_all_my_notifications_read',
    'mark_my_notification_read',
  ]) {
    assert.match(sql, new RegExp(`revoke execute on function jfl\\.${name}\\([^;]+from public, anon, authenticated;`, 's'));
  }
  assert.doesNotMatch(sql, /(?:alter|revoke|grant)\s+(?:table|function|execute|select).*\b(?:dru|gamma|public)\./i);
});

test('JFL notification migration documents reversible baseline grants', () => {
  assert.match(sql, /alter table jfl\.user_notifications disable row level security;/);
  assert.match(sql, /grant select on table jfl\.user_notifications to anon, authenticated;/);
  for (const name of [
    'admin_broadcast_notification',
    'create_user_notification',
    'list_my_notifications',
    'mark_all_my_notifications_read',
    'mark_my_notification_read',
  ]) {
    assert.match(sql, new RegExp(`grant execute on function jfl\\.${name}\\([^;]+to public, anon, authenticated;`, 's'));
  }
});
