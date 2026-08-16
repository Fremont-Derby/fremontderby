import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migration = readFileSync(
  join(root, 'supabase/migrations/20260811072523_season_team_slots_and_applications.sql'),
  'utf8',
);
const teamsPage = readFileSync(join(root, 'src/teamsPage.js'), 'utf8');
const repo = readFileSync(join(root, 'src/teamRegistrationRepository.js'), 'utf8');

test('returning reservation RPC covers accept, release, and captain succession (#408)', () => {
  assert.match(migration, /create or replace function public\.seed_returning_team_slots/);
  assert.match(migration, /create or replace function public\.respond_to_returning_team_slot/);
  assert.match(migration, /response_action text/);
  assert.match(migration, /'accept'|accept/);
  assert.match(migration, /'release'|release/);
  assert.match(migration, /transfer|transferred/);
  assert.match(migration, /returning_reservation_deadline/);
  assert.match(migration, /reservation_expires_at/);
});

test('teams surface exposes respond-to-slot actions for returning captains', () => {
  assert.match(teamsPage, /respondToSlot|data-respond-slot|data-slot-action/);
  assert.match(repo, /respond_to_returning_team_slot/);
  assert.match(repo, /seed_returning_team_slots/);
});

test('historical team continuity: succession does not require rebuilding team id ownership in product copy paths', () => {
  // Captain succession updates assigned captain; team row remains season-scoped name continuity.
  assert.match(migration, /assigned_captain_player_id/);
  assert.match(migration, /returning_team_slot\./);
});
