import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderLineupPage } from '../src/lineupPage.js';

const migrationUrl = new URL('../supabase/migrations/20260811123000_nightly_lineup_sub_picker.sql', import.meta.url);

async function migrationSql() {
  return readFile(migrationUrl, 'utf8');
}

test('nightly availability removes the obsolete four-player roster gate', async () => {
  const sql = await migrationSql();
  assert.doesNotMatch(sql, /active_roster_count\s*<\s*4/i);
  assert.doesNotMatch(sql, /not exists\s*\(\s*select 1\s+from public\.team_memberships active_tm/i);
  assert.match(sql, /'substitute'::text as participation_type/i);
  assert.match(sql, /private\.roster_availability[\s\S]*ra\.status = 'available'/i);
  assert.match(sql, /private\.free_agent_availability[\s\S]*fa\.status = 'available'/i);
});

test('nightly lineup keeps the trusted seven-match cap and payment gate', async () => {
  const sql = await migrationSql();
  assert.match(sql, /regular_matches_scheduled integer/i);
  assert.match(sql, /Season limit reached \(7\/7\)/i);
  assert.match(sql, /Payment required before playing/i);
  assert.match(sql, /ps\.status in \('paid', 'waived'\)/i);
  assert.match(sql, /Every lineup player must be paid or waived before playing/i);
  assert.match(sql, /revoke all on function public\.submit_team_lineup[\s\S]*anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.submit_team_lineup[\s\S]*service_role/i);
});

test('lineup page is a mobile one-tap roster and substitute picker', () => {
  const html = renderLineupPage();
  assert.match(html, /Pick your three/);
  assert.doesNotMatch(html, /Pick tonight's players/);
  assert.match(html, /Available substitutes/);
  assert.match(html, /data-player-search/);
  assert.match(html, /dataset\.addPlayer/);
  assert.match(html, /\/7 played/);
  assert.match(html, /eligibility_reason/);
  assert.match(html, /Forfeit slot/);
  assert.match(html, /Lock this lineup\?/);
  assert.match(html, /Score the three matches/);
  assert.match(html, /selectedSlots\.findIndex/);
  assert.match(html, /index<3/);
});
