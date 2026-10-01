import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase/migrations/20260816240000_trial_two_league_nights.sql'),
  'utf8',
);

test('trial nights schema and helpers exist', () => {
  assert.match(sql, /player_trial_league_nights/);
  assert.match(sql, /player_may_use_trial_or_paid/);
  assert.match(sql, /player_trial_nights_used/);
  assert.match(sql, /player_prize_eligible/);
  assert.match(sql, /nights_used < 2/);
});

test('submit_team_lineup uses trial-or-paid gate and records nights', () => {
  assert.match(sql, /player_may_use_trial_or_paid/);
  assert.match(sql, /Payment required after two free league nights/);
  assert.match(sql, /insert into private\.player_trial_league_nights/);
  assert.doesNotMatch(sql, /Every lineup player must be paid or waived before playing/);
});
