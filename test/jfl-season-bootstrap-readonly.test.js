import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const migrationPath = new URL('../supabase/migrations/20260820181000_jfl_public_season_registration_read_only.sql', import.meta.url);

test('JFL public season bootstrap migration restores a side-effect-free STABLE read model', () => {
  assert.equal(
    existsSync(migrationPath),
    true,
    'expected a focused JFL migration for the public season-registration read model',
  );

  const sql = readFileSync(migrationPath, 'utf8');
  assert.match(sql, /create\s+or\s+replace\s+function\s+jfl\.list_all_season_registration_internal\s*\(\s*\)/i);
  assert.match(sql, /language\s+sql/i);
  assert.match(sql, /\bstable\b/i);
  assert.match(sql, /security\s+definer/i);
  assert.match(sql, /jfl\.seasons/i);
  assert.match(sql, /jfl_private\.season_team_slots/i);
  assert.match(sql, /jfl_private\.team_applications/i);
  assert.match(sql, /jfl\.team_memberships/i);
  assert.match(sql, /jfl\.season_players/i);
  assert.doesNotMatch(sql, /expire_season_team_registration/i);
  assert.doesNotMatch(sql, /\b(update|insert|delete|merge|truncate)\b/i);
});
