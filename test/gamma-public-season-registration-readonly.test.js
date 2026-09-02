import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(
  new URL('../supabase/migrations/20260902040000_gamma_public_season_registration_readonly.sql', import.meta.url),
  'utf8',
);

test('Gamma public season registration read model is STABLE SQL without expiry', () => {
  assert.match(sql, /Tracks #1820/);
  assert.match(sql, /create or replace function gamma\.list_all_season_registration_internal\(\)/i);
  assert.match(sql, /create or replace function gamma\.list_public_season_registration\(\)/i);
  assert.match(sql, /language sql\s+stable/i);
  assert.doesNotMatch(sql, /expire_season_team_registration/);
  assert.doesNotMatch(sql, /language plpgsql/i);
  assert.doesNotMatch(sql, /\bjfl\./i);
  assert.doesNotMatch(sql, /\bdru\./i);
});
