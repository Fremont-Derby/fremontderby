import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const API_ROOT = 'https://api.cloudflare.com/client/v4';
const CONFIG_URL = new URL('../config/cloudflare-workers-builds.json', import.meta.url);

function sortedStrings(values) {
  return [...(values || [])].map(String).sort();
}

function sameStrings(left, right) {
  return JSON.stringify(sortedStrings(left)) === JSON.stringify(sortedStrings(right));
}

export function findWorkerScript(scripts, workerNames) {
  for (const name of workerNames || []) {
    const match = (scripts || []).find((script) => script?.id === name);
    if (match) return match;
  }
  return null;
}

export function choosePrimaryTrigger(triggers, desired) {
  const active = (triggers || []).filter((trigger) => !trigger?.deleted_on);
  const exact = active.filter(
    (trigger) => sameStrings(trigger.branch_includes, [desired.branch]) &&
      !(trigger.branch_includes || []).includes('*'),
  );
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    throw new Error(`Multiple exact production triggers found for ${desired.branch}.`);
  }

  const named = active.filter((trigger) => /production|deploy production/i.test(trigger.trigger_name || ''));
  if (named.length === 1) return named[0];

  throw new Error(
    `Could not identify one production trigger for branch ${desired.branch}; ` +
      `found ${active.length} active trigger(s). Refusing ambiguous mutation.`,
  );
}

export function desiredTriggerPatch(desired) {
  return {
    trigger_name: `Fremont Derby ${desired.buildLane} release`,
    build_command: desired.buildCommand,
    deploy_command: desired.deployCommand,
    root_directory: '/',
    branch_includes: [desired.branch],
    branch_excludes: [],
    path_includes: ['*'],
    path_excludes: [],
    build_caching_enabled: true,
  };
}

export function triggerMatchesDesired(trigger, desired) {
  const patch = desiredTriggerPatch(desired);
  return (
    sameStrings(trigger?.branch_includes, patch.branch_includes) &&
    sameStrings(trigger?.branch_excludes, patch.branch_excludes) &&
    sameStrings(trigger?.path_includes, patch.path_includes) &&
    sameStrings(trigger?.path_excludes, patch.path_excludes) &&
    String(trigger?.build_command || '') === patch.build_command &&
    String(trigger?.deploy_command || '') === patch.deploy_command &&
    String(trigger?.root_directory || '') === patch.root_directory
  );
}

export function planWorkerTriggerChanges(triggers, desired) {
  const primary = choosePrimaryTrigger(triggers, desired);
  const extras = (triggers || []).filter(
    (trigger) => !trigger?.deleted_on && trigger?.trigger_uuid !== primary.trigger_uuid,
  );
  return {
    primary,
    extras,
    patch: desiredTriggerPatch(desired),
    triggerNeedsPatch: !triggerMatchesDesired(primary, desired),
  };
}

async function loadConfig() {
  return JSON.parse(await readFile(CONFIG_URL, 'utf8'));
}

function requireEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function cloudflareRequest(accountId, token, path, options = {}) {
  const response = await fetch(`${API_ROOT}/accounts/${accountId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const messages = [
      ...(payload.errors || []).map((item) => item?.message).filter(Boolean),
      ...(payload.messages || []).map((item) => item?.message).filter(Boolean),
    ];
    throw new Error(
      `Cloudflare ${options.method || 'GET'} ${path} failed (${response.status}): ` +
        (messages.join('; ') || 'unknown error'),
    );
  }
  return payload.result;
}

async function resolveWorker(accountId, token, desired) {
  const scripts = await cloudflareRequest(accountId, token, '/workers/scripts');
  const worker = findWorkerScript(scripts, desired.workerNames);
  if (!worker?.tag) {
    throw new Error(
      `Could not resolve Worker script for candidates: ${(desired.workerNames || []).join(', ')}.`,
    );
  }
  return worker;
}

async function readLaneState(accountId, token, desired) {
  const worker = await resolveWorker(accountId, token, desired);
  const triggers = await cloudflareRequest(
    accountId,
    token,
    `/builds/workers/${encodeURIComponent(worker.tag)}/triggers`,
  );
  const plan = planWorkerTriggerChanges(triggers, desired);
  const env = await cloudflareRequest(
    accountId,
    token,
    `/builds/triggers/${plan.primary.trigger_uuid}/environment_variables`,
  );
  return { worker, triggers, plan, env };
}

export function stateMatchesDesired(state, desired) {
  const laneVar = state?.env?.FREMONT_BUILD_LANE?.value;
  return (
    !state.plan.triggerNeedsPatch &&
    state.plan.extras.length === 0 &&
    laneVar === desired.buildLane
  );
}

async function applyLane(accountId, token, lane, desired) {
  const before = await readLaneState(accountId, token, desired);
  console.log(
    JSON.stringify({
      lane,
      worker: before.worker.id,
      workerTag: before.worker.tag,
      primaryTrigger: before.plan.primary.trigger_uuid,
      deleteExtraTriggers: before.plan.extras.map((trigger) => trigger.trigger_uuid),
      triggerNeedsPatch: before.plan.triggerNeedsPatch,
      currentBuildLane: before.env?.FREMONT_BUILD_LANE?.value || null,
      desiredBranch: desired.branch,
      desiredDeployCommand: desired.deployCommand,
    }),
  );

  if (before.plan.triggerNeedsPatch) {
    await cloudflareRequest(
      accountId,
      token,
      `/builds/triggers/${before.plan.primary.trigger_uuid}`,
      { method: 'PATCH', body: JSON.stringify(before.plan.patch) },
    );
  }

  if (before.env?.FREMONT_BUILD_LANE?.value !== desired.buildLane) {
    await cloudflareRequest(
      accountId,
      token,
      `/builds/triggers/${before.plan.primary.trigger_uuid}/environment_variables`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          FREMONT_BUILD_LANE: { value: desired.buildLane, is_secret: false },
        }),
      },
    );
  }

  // Delete preview/non-production triggers only after the retained production trigger is safe.
  for (const extra of before.plan.extras) {
    await cloudflareRequest(accountId, token, `/builds/triggers/${extra.trigger_uuid}`, {
      method: 'DELETE',
    });
  }

  const after = await readLaneState(accountId, token, desired);
  if (!stateMatchesDesired(after, desired)) {
    throw new Error(`Cloudflare Workers Builds desired-state verification failed for ${lane}.`);
  }
  console.log(`PASS ${lane}: only ${desired.branch} can trigger ${desired.deployCommand}.`);
}

async function checkLane(accountId, token, lane, desired) {
  const state = await readLaneState(accountId, token, desired);
  console.log(
    JSON.stringify({
      lane,
      worker: state.worker.id,
      primaryTrigger: state.plan.primary.trigger_uuid,
      extraTriggerCount: state.plan.extras.length,
      triggerMatchesDesired: !state.plan.triggerNeedsPatch,
      buildLane: state.env?.FREMONT_BUILD_LANE?.value || null,
      desiredBranch: desired.branch,
      desiredDeployCommand: desired.deployCommand,
    }),
  );
  if (!stateMatchesDesired(state, desired)) {
    throw new Error(`Cloudflare Workers Builds drift detected for ${lane}.`);
  }
  console.log(`PASS ${lane}: Workers Builds configuration matches repository desired state.`);
}

async function main() {
  const mode = String(process.argv[2] || 'check').trim().toLowerCase();
  const requestedLane = String(process.argv[3] || 'all').trim().toLowerCase();
  if (!['check', 'apply'].includes(mode)) {
    throw new Error('Mode must be check or apply.');
  }

  const config = await loadConfig();
  const laneNames = requestedLane === 'all' ? Object.keys(config.workers) : [requestedLane];
  for (const lane of laneNames) {
    if (!config.workers[lane]) throw new Error(`Unknown lane ${lane}.`);
  }

  const accountId = requireEnv('CLOUDFLARE_ACCOUNT_ID');
  const token = requireEnv('CLOUDFLARE_BUILDS_API_TOKEN');

  for (const lane of laneNames) {
    const desired = config.workers[lane];
    if (mode === 'apply') await applyLane(accountId, token, lane, desired);
    else await checkLane(accountId, token, lane, desired);
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
