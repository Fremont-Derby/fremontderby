import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const sql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase/migrations/20260816230000_membership_season_wide_precheck.sql'),
  'utf8',
);

test('membership RPCs raise season-wide active membership errors', () => {
  assert.match(sql, /invite_player_to_team/);
  assert.match(sql, /request_team_membership/);
  assert.match(sql, /respond_to_team_invitation/);
  assert.match(sql, /respond_to_team_membership_request/);
  assert.equal(
    (sql.match(/Player already has an active team membership/g) || []).length >= 4,
    true,
  );
  assert.match(sql, /team_id is distinct from/);
});
