import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL(
  '../supabase/migrations/20260811234500_admin_season_team_assignment.sql',
  import.meta.url,
);

test('candidate directory and assignment RPC remain inaccessible to browser roles', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  for (const fn of ['list_admin_season_team_candidates', 'admin_add_team_to_season']) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}[\\s\\S]*from public, anon, authenticated`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}[\\s\\S]*to service_role`));
  }
});
