import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('pending ready checks migration requires unanswered filter', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260816093000_list_pending_ready_checks_unanswered_only.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /resp\.response is null/);
  assert.match(sql, /list_my_pending_ready_checks/);
});
