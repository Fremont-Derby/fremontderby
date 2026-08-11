import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260811031000_remove_four_player_roster_cap.sql',
  import.meta.url,
);

test('team invitation migration removes the four-player roster cap', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /create or replace function public\.invite_player_to_team/i);
  assert.match(sql, /create or replace function public\.respond_to_team_invitation/i);
  assert.doesNotMatch(sql, /active_roster_count/i);
  assert.doesNotMatch(sql, /pending_invitation_count/i);
  assert.doesNotMatch(sql, />=\s*4/);
  assert.doesNotMatch(sql, /no open primary spots/i);
});

test('unlimited roster migration preserves captain scope and one-active-team protection', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /Only the active captain can invite players/i);
  assert.match(sql, /Player already has an active team membership/i);
  assert.match(sql, /Only the invited player can respond/i);
  assert.match(sql, /insert into public\.team_memberships/i);
});
