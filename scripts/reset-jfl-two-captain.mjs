import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const jflUrl = 'https://jfl.fremontderby.com';
const stagingUrl = 'https://oqkkvqkerusepyokzbmt.supabase.co';
const fixtureId = '18580000-1300-4000-8000-000000000001';

async function readExactJflHealth(fetchImpl, expectedSha) {
  const response = await fetchImpl(`${jflUrl}/health/environment`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`JFL health returned HTTP ${response.status}`);
  const health = await response.json();
  if (health.environment !== 'jfl' || health.expectedSupabaseSchema !== 'jfl'
    || health.ok !== true || health.versionTag !== expectedSha) {
    throw new Error('The live JFL environment is not the requested exact SHA');
  }
}

export async function resetJflTwoCaptainFixture({ fetchImpl = fetch, serviceRoleKey, expectedSha }) {
  if (!serviceRoleKey || !expectedSha) throw new Error('Staging key and exact JFL SHA are required');
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
  await readExactJflHealth(fetchImpl, expectedSha);
  return { resetLineups: rows[0].reset_lineups };
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
  console.log(`PASS: exact-SHA JFL QA fixture reset; prior lineups=${result.resetLineups}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
