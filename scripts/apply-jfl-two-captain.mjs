import { readFileSync } from 'node:fs';

// #2802. This script is only called after merge on the trusted permanent JFL
// branch. A project-ref URL prevents a PostgreSQL URI from selecting prod.
const stagingRef = 'oqkkvqkerusepyokzbmt';
const productionRef = 'cpiucsxlkicmlbvdvhww';
const projectUrl = `https://api.supabase.com/v1/projects/${stagingRef}/database/query`;
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (process.env.GITHUB_REF !== 'refs/heads/fremontderby-jfl'
  || process.env.GITHUB_REPOSITORY !== 'Fremont-Derby/fremontderby'
  || process.env.GITHUB_ACTOR !== 'subiki') {
  throw new Error('Refusing to run outside a trusted permanent JFL push');
}
if (!token) throw new Error('Supabase Management API token is unavailable');
if (projectUrl.includes(productionRef)) throw new Error('Refusing the production database project');

const fixture = readFileSync(new URL('./seed-jfl-two-captain.sql', import.meta.url), 'utf8');
if (!fixture.includes("to_regnamespace('jfl')")
  || /\b(?:insert|update|delete|truncate|drop|alter)\s+(?:into\s+|from\s+|table\s+)?(?:gamma|dru|public)\./i.test(fixture)) {
  throw new Error('Fixture does not satisfy JFL-only write guard');
}

async function query(sql, { readOnly = false } = {}) {
  let response;
  try {
    response = await fetch(projectUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: sql, read_only: readOnly }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new Error('Supabase Management API transport failed');
  }
  if (response.status !== 201) {
    throw new Error(`Supabase Management API ${readOnly ? 'read' : 'write'} failed with HTTP ${response.status}`);
  }
  const body = await response.json().catch(() => null);
  if (body?.error) throw new Error(`Supabase Management API ${readOnly ? 'read' : 'write'} returned a query error`);
  return body;
}

function firstRow(body) {
  const rows = Array.isArray(body) ? body : body?.result ?? body?.data;
  return Array.isArray(rows) ? rows[0] : null;
}

const prerequisite = firstRow(await query(`
  select count(*)::integer as qa_seasons
  from jfl.seasons
  where id = '18580000-1000-4000-8000-000000000000' and purpose = 'qa';
`, { readOnly: true }));
if (Number(prerequisite?.qa_seasons) !== 1) {
  throw new Error('JFL QA Persona Lab prerequisite was not verified; no write attempted');
}

await query(fixture);

const readback = firstRow(await query(`
  select
    (select count(*)::integer
     from jfl.team_matches m join jfl.rounds r on r.id = m.round_id
     where m.id = '18580000-1300-4000-8000-000000000001'
       and r.stage = 'regular'
       and m.team_a_id = '18580000-1100-4000-8000-000000000001'
       and m.team_b_id = '18580000-1100-4000-8000-000000000002') as matchup_count,
    (select count(*)::integer
     from jfl.team_memberships tm
     join jfl_private.payment_status ps
       on ps.season_id = tm.season_id and ps.player_id = tm.player_id
     where tm.season_id = '18580000-1000-4000-8000-000000000000'
       and tm.player_id in (
         '18580000-2000-4000-8000-000000000002',
         '18580000-2000-4000-8000-000000000003',
         '18580000-2000-4000-8000-000000000004',
         '18580000-2000-4000-8000-000000000005',
         '18580000-2000-4000-8000-000000000006',
         '18580000-2000-4000-8000-000000000007'
       ) and tm.ends_at is null and ps.status = 'waived') as eligible_count;
`, { readOnly: true }));
if (Number(readback?.matchup_count) !== 1 || Number(readback?.eligible_count) !== 6) {
  throw new Error('JFL QA fixture readback did not meet matchup/eligibility counts');
}
console.log(`JFL-only QA fixture verified at ${process.env.GITHUB_SHA}: one matchup, six eligible memberships.`);
