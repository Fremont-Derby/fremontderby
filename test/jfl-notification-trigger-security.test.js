import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260930221536_jfl_notification_trigger_search_path.sql',
  import.meta.url,
);

test('JFL notification trigger hardening is scoped, drift-aware, and reversible', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /pn\.nspname = 'jfl'/);
  assert.match(sql, /tn\.nspname = 'jfl'/);
  assert.match(sql, /p\.proname = 'user_notifications_sync_user_ids'/);
  assert.match(sql, /p\.proconfig is null/);
  assert.match(sql, /md5\(p\.prosrc\) = '[0-9a-f]{32}'/);
  assert.match(sql, /count\(\*\) from pg_trigger other/);
  assert.match(sql, /alter function jfl\.user_notifications_sync_user_ids\(\) set search_path = '';/);
  assert.match(sql, /revoke execute on function jfl\.user_notifications_sync_user_ids\(\)\s+from public, anon, authenticated;/);
  assert.match(sql, /alter function jfl\.user_notifications_sync_user_ids\(\) reset search_path;/);
  assert.match(sql, /grant execute on function jfl\.user_notifications_sync_user_ids\(\) to public;/);
  assert.doesNotMatch(sql, /\b(?:dru|gamma|production)\./i);
});
