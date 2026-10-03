import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { appendFile } from 'node:fs/promises';

const jflUrl = 'https://jfl.fremontderby.com';
const stagingUrl = 'https://oqkkvqkerusepyokzbmt.supabase.co';
const fixtureId = '18580000-1300-4000-8000-000000000001';
const seasonId = '18580000-1000-4000-8000-000000000000';
const roundId = '18580000-1200-4000-8000-000000000001';

// Seven UTC calendar days ahead remains upcoming even across local midnight,
// DST, and the extreme browser time zones. Replays on the same UTC day agree.
export function upcomingFixtureDate(now = new Date()) {
  const date = new Date(now);
  if (!Number.isFinite(date.getTime())) throw new Error('A valid fixture clock is required');
  date.setUTCDate(date.getUTCDate() + 7);
  return date.toISOString().slice(0, 10);
}

async function prepareFixtureDate(fetchImpl, serviceRoleKey, scheduledOn) {
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    'accept-profile': 'jfl',
    'content-profile': 'jfl',
    accept: 'application/json',
    'content-type': 'application/json',
    prefer: 'return=representation',
  };
  async function rows(path, options = {}) {
    const response = await fetchImpl(`${stagingUrl}/rest/v1/${path}`, { headers, ...options });
    if (!response.ok) throw new Error(`JFL QA date preparation returned HTTP ${response.status}`);
    const body = await response.json();
    if (!Array.isArray(body)) throw new Error('JFL QA date preparation returned invalid rows');
    return body;
  }
  const seasons = await rows(`seasons?id=eq.${seasonId}&select=id,purpose`);
  if (seasons.length !== 1 || seasons[0].id !== seasonId || seasons[0].purpose !== 'qa') {
    throw new Error('The fixed JFL QA season is required for date preparation');
  }
  const path = `rounds?id=eq.${roundId}&season_id=eq.${seasonId}&stage=eq.regular&round_number=eq.1&select=id,season_id,scheduled_on`;
  const existing = await rows(path);
  if (existing.length !== 1 || existing[0].id !== roundId || existing[0].season_id !== seasonId) {
    throw new Error('The fixed JFL QA round is required for date preparation');
  }
  const updated = await rows(path, { method: 'PATCH', body: JSON.stringify({ scheduled_on: scheduledOn }) });
  const persisted = await rows(path);
  for (const result of [updated, persisted]) {
    if (result.length !== 1 || result[0].id !== roundId || result[0].season_id !== seasonId
      || result[0].scheduled_on !== scheduledOn) {
      throw new Error('The fixed JFL QA date did not persist');
    }
  }
}

async function readExactJflHealth(fetchImpl, expectedSha) {
  const response = await fetchImpl(`${jflUrl}/health/environment`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`JFL health returned HTTP ${response.status}`);
  const health = await response.json();
  if (health.environment !== 'jfl' || health.expectedSupabaseSchema !== 'jfl'
    || health.ok !== true || health.versionTag !== expectedSha) {
    throw new Error('The live JFL environment is not the requested exact SHA');
  }
}

export async function resetJflTwoCaptainFixture({ fetchImpl = fetch, serviceRoleKey, expectedSha, now = new Date() }) {
  if (!serviceRoleKey || !expectedSha) throw new Error('Staging key and exact JFL SHA are required');
  const scheduledOn = upcomingFixtureDate(now);
  await readExactJflHealth(fetchImpl, expectedSha);
  const response = await fetchImpl(`${stagingUrl}/rest/v1/rpc/reset_two_captain_qa`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-profile': 'jfl',
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: '{}',
  });
  if (!response.ok) throw new Error(`Staging-only QA reset returned HTTP ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0]?.team_match_id !== fixtureId
    || !Number.isInteger(rows[0]?.reset_lineups)) {
    throw new Error('Staging-only QA reset did not return the fixed matchup');
  }
  // The RPC above verifies the exact QA matchup and its two fixed teams before
  // any calendar write. A partial failure prevents the browser job from starting;
  // a subsequent trusted reset can safely replay both steps.
  await prepareFixtureDate(fetchImpl, serviceRoleKey, scheduledOn);
  await readExactJflHealth(fetchImpl, expectedSha);
  return { resetLineups: rows[0].reset_lineups, scheduledOn };
}

async function main() {
  const expectedSha = process.env.GITHUB_SHA || '';
  const serviceRoleKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || '';
  if (!expectedSha || !serviceRoleKey) throw new Error('Trusted JFL SHA and staging key are required');
  const deadline = Date.now() + 12 * 60_000;
  while (true) {
    try {
      await readExactJflHealth(fetch, expectedSha);
      break;
    } catch (error) {
      if (error.message !== 'The live JFL environment is not the requested exact SHA'
        && !/^JFL health returned HTTP/.test(error.message)) throw error;
      if (Date.now() >= deadline) throw new Error('Exact JFL deployment did not appear before the browser preflight deadline');
      await delay(15_000);
    }
  }
  // Once the deployment is present, a reset is attempted exactly once.
  const result = await resetJflTwoCaptainFixture({ serviceRoleKey, expectedSha });
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `scheduled_on=${result.scheduledOn}\n`);
  }
  console.log(`PASS: exact-SHA JFL QA fixture reset; prior lineups=${result.resetLineups}; scheduledOn=${result.scheduledOn}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
