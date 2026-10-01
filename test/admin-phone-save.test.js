import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('an admin can save one player phone', () => {
  const http = readFileSync(new URL('../src/playerContactHttp.js', import.meta.url), 'utf8');
  const sql = readFileSync(new URL('../supabase/migrations/20261001120000_admin_set_player_phone.sql', import.meta.url), 'utf8');
  assert.match(http, /setAdminPlayerContactCommand/);
  assert.match(sql, /set_admin_player_phone/);
  assert.match(sql, /Actor is not a league admin/);
});
