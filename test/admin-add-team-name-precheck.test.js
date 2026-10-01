import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase/migrations/20260816232000_admin_add_team_name_precheck.sql'), 'utf8');
test('admin_add_team_to_season checks team name before insert', () => {
  assert.match(sql, /admin_add_team_to_season/);
  assert.match(sql, /That team name is already used in this season/);
});
