import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { domainsForEnv } from './lane-custom-domains.mjs';

export const laneDeployments = Object.freeze({
  jfl: Object.freeze({ branch: 'fremontderby-jfl', environment: 'jfl' }),
  dru: Object.freeze({ branch: 'fremontderby-dru', environment: 'dru' }),
  gamma: Object.freeze({ branch: 'fremontderby-gamma', environment: 'gamma' }),
});

function requireValue(value, message) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(message);
  return normalized;
}

export function resolveDeployBranch(env = process.env, spawn = spawnSync) {
  if (env.GITHUB_ACTIONS === 'true') {
    return requireValue(env.GITHUB_REF_NAME, 'GitHub Actions did not provide GITHUB_REF_NAME.');
  }
  if (env.WORKERS_CI === '1') {
    return requireValue(env.WORKERS_CI_BRANCH, 'Workers Builds did not provide WORKERS_CI_BRANCH.');
  }

  const result = spawn('git', ['branch', '--show-current'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error('Could not determine the current Git branch for lane deployment.');
  }
  return requireValue(result.stdout, 'Refusing lane deploy from a detached or unknown Git branch.');
}

export function assertLaneDeployContext(lane, env = process.env, spawn = spawnSync) {
  const config = laneDeployments[lane];
  if (!config) throw new Error(`Unknown release lane "${lane}".`);

  const branch = resolveDeployBranch(env, spawn);

  // CI must always fail closed on branch/lane mismatches. The local override exists only
  // for an explicit human recovery from a checked-out branch and can never bypass CI.
  const isCi = env.GITHUB_ACTIONS === 'true' || env.WORKERS_CI === '1';
  if (!isCi && env.FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN === '1') {
    return config;
  }

  if (branch !== config.branch) {
    throw new Error(
      `Refusing ${lane} deploy from branch "${branch}"; expected "${config.branch}".`,
    );
  }
  return config;
}

export function laneDeployArgs(lane, env = process.env, spawn = spawnSync) {
  const config = assertLaneDeployContext(lane, env, spawn);
  const args = ['wrangler', 'deploy', '--env', config.environment];
  // Prefer CI full SHAs; DEPLOY_GIT_SHA remains a local/canary fallback (same as production).
  const sha = String(
    env.WORKERS_CI_COMMIT_SHA || env.GITHUB_SHA || env.DEPLOY_GIT_SHA || '',
  ).trim();
  if (/^[0-9a-f]{40}$/i.test(sha)) {
    args.push('--tag', sha, '--message', `git:${sha}`);
  }
  if (sha && /^[0-9a-f]{7,40}$/i.test(sha)) {
    // CF_VERSION_METADATA.tag is often empty even with --tag; expose SHA to /health via var.
    args.push('--var', `DEPLOY_GIT_SHA:${sha}`);
  }
  return args;
}

export function runLaneDeploy(lane, { env = process.env, spawn = spawnSync } = {}) {
  const isWin = process.platform === 'win32';
  const args = laneDeployArgs(lane, env, spawn);
  const result = spawn(isWin ? 'npx' : 'npx', args, {
    env,
    stdio: 'inherit',
    shell: isWin,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  try {
    runLaneDeploy(process.argv[2]);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

export function expectedHostnamesForLane(lane) {
  const envName = laneDeployments[lane]?.environment;
  if (!envName) return [];
  return domainsForEnv(envName).map((row) => row.hostname);
}
