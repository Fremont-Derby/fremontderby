import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/20260811041000_captain_lifecycle.sql',
  'utf8',
);

test('team creation explicitly blocks a second active team in the same season', () => {
  assert.match(sql, /You already belong to a team in this season and cannot create another/);
  assert.match(sql, /one_active_captain_team_per_season/i);
});

test('captaincy transfer requires an active rostered teammate', () => {
  assert.match(sql, /New captain must be an active rostered player on this team/);
  assert.match(sql, /role = 'player'[\s\S]*ends_at is null/i);
});

test('new captain must accept the handoff before authority changes', () => {
  assert.match(sql, /function public\.respond_to_captaincy_transfer/i);
  assert.match(sql, /Only the proposed captain can respond to this transfer/);
  assert.match(sql, /response_status not in \('accepted','declined'\)/i);
});

test('accepted handoff supports staying as player or leaving the team', () => {
  assert.match(sql, /departure_mode in \('remain','leave'\)/i);
  assert.match(sql, /set role = 'captain'/i);
  assert.match(sql, /set ends_at = now\(\)/i);
  assert.match(sql, /set role = 'player'/i);
});

test('captain lifecycle storage and RPCs are not browser callable', () => {
  assert.match(sql, /alter table private\.captaincy_transfers enable row level security/i);
  assert.match(sql, /revoke all on private\.captaincy_transfers from public, anon, authenticated/i);
  for (const signature of [
    'request_captaincy_transfer\\(uuid, uuid, uuid, text\\)',
    'respond_to_captaincy_transfer\\(uuid, uuid, text\\)',
    'cancel_captaincy_transfer\\(uuid, uuid\\)',
    'get_own_captaincy_transfers\\(uuid\\)',
  ]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${signature} from public, anon, authenticated`, 'i'));
  }
});
