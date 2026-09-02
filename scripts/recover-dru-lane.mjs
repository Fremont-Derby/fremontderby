import { fileURLToPath } from 'node:url';
import { clearDruOverrideSecrets, DRU_WORKER_SCRIPT_NAME } from './clear-dru-override-secrets.mjs';
import { runLaneDeploy } from './deploy-lane.mjs';

const EXPECTED_PROJECT_REF = 'oqkkvqkerusepyokzbmt';
const EXPECTED_SCHEMA = 'dru';
const HEALTH_URL = 'https://dru.fremontderby.com/health/environment';

function truthy(value) {
  return ['1', 'true', 'yes'].includes(String(value || '').trim().toLowerCase());
}

export async function probeDruEnvironment(fetchImpl = fetch) {
  const response = await fetchImpl(HEALTH_URL, { redirect: 'manual' });
  const text = await response.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 300) };
  }
  return Object.freeze({
    status: response.status,
    ok: body.ok === true,
    environment: body.environment || null,
    schema: body.expectedSupabaseSchema || body.schema || null,
    projectRef:
      body.checks?.find((row) => row.projectRef)?.projectRef
      || body.supabase?.projectRef
      || null,
    body,
  });
}

export function druProbePassed(probe) {
  if (!probe || probe.status !== 200 || probe.ok !== true) return false;
  if (probe.environment !== 'dru') return false;
  if (probe.schema && probe.schema !== EXPECTED_SCHEMA) return false;
  if (probe.projectRef && probe.projectRef !== EXPECTED_PROJECT_REF) return false;
  return true;
}

export async function recoverDruLane({
  env = process.env,
  fetchImpl = fetch,
  deploy = runLaneDeploy,
} = {}) {
  const clearance = await clearDruOverrideSecrets({
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: env.CLOUDFLARE_API_TOKEN,
    fetchImpl,
  });

  let deployed = false;
  if (truthy(env.RECOVER_DRU_DEPLOY)) {
    const deployEnv = {
      ...env,
      FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN: '1',
    };
    deploy('dru', { env: deployEnv });
    deployed = true;
  }

  const probe = await probeDruEnvironment(fetchImpl);
  return Object.freeze({
    worker: DRU_WORKER_SCRIPT_NAME,
    clearance,
    deployed,
    probe,
    healthy: druProbePassed(probe),
  });
}

export async function run(env = process.env) {
  const outcome = await recoverDruLane({ env });
  console.log(JSON.stringify({
    worker: outcome.worker,
    deletedOrAbsent: outcome.clearance.results.map((row) => `${row.secretName}:${row.status}`),
    deployed: outcome.deployed,
    probeStatus: outcome.probe.status,
    environment: outcome.probe.environment,
    healthy: outcome.healthy,
  }));
  if (truthy(env.RECOVER_DRU_DEPLOY) && !outcome.healthy) {
    throw new Error(
      `DRU still unhealthy after recover: HTTP ${outcome.probe.status} environment=${outcome.probe.environment}`,
    );
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  try {
    await run();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
