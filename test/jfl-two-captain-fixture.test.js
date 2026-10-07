import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../scripts/seed-jfl-two-captain.sql', import.meta.url), 'utf8');
const apply = readFileSync(new URL('../scripts/apply-jfl-two-captain.mjs', import.meta.url), 'utf8');

test('JFL two-captain seed publishes one shared regular matchup and eligible rosters', () => {
  assert.match(sql, /to_regnamespace\('jfl'\)/);
  assert.match(sql, /purpose = 'qa'/);
  assert.match(sql, /insert into jfl\.rounds/i);
  assert.match(sql, /insert into jfl\.team_matches/i);
  assert.match(sql, /insert into jfl\.team_memberships/i);
  assert.match(sql, /insert into jfl_private\.payment_status/i);
  assert.match(sql, /set status = 'waived'/);
  assert.match(sql, /on conflict \(id\) do nothing/gi);
  assert.doesNotMatch(sql, /insert into (?:gamma|dru|public)\./i);
  assert.doesNotMatch(sql, /delete from|truncate table|drop table/i);
});

test('QA substitute reuses the no-team persona without bypassing availability', () => {
  assert.match(sql, /insert into jfl\.season_players \(season_id, player_id, participation_type, status\)/);
  assert.match(sql, /'18580000-2000-4000-8000-000000000001', 'free_agent', 'active'/);
  assert.match(sql, /on conflict \(season_id, player_id\) do update\s+set participation_type = 'free_agent', status = 'active'/);
  assert.doesNotMatch(sql, /insert into jfl\.(?:player_availability|date_availability)/i);
  assert.match(apply, /sp\.participation_type = 'free_agent' and sp\.status = 'active'/);
  assert.match(apply, /not exists \([\s\S]*?tm\.ends_at is null/);
  assert.match(apply, /Number\(readback\?\.free_agent_count\) !== 1/);
});
