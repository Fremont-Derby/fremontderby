import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('migration exposes makeup_on on scorable matches', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20260816100000_scorable_matches_makeup_on.sql', import.meta.url), 'utf8');
  assert.match(sql, /makeup_on date/);
  assert.match(sql, /coalesce\(makeup_on, scheduled_on\)/);
});

test('score hub keeps tools when empty', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, /hubEl\.hidden=false/);
  assert.match(src, /function playDate/);
});
