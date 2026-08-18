import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
  if (branch !== config.branch) {
    throw new Error(
      `Refusing ${lane} deploy from branch "${branch}"; expected "${config.branch}".`,
    );
  }
  return config;
}

/**
 * Prefer GITHUB_SHA (Actions) then WORKERS_CI_COMMIT_SHA (Cloudflare Workers Builds).
 * Only accept a full 40-char hex SHA so we never stamp a partial or non-git value.
 */
export function resolveDeploySha(env = process.env) {
  const candidates = [env.GITHUB_SHA, env.WORKERS_CI_COMMIT_SHA];
  for (const raw of candidates) {
    const sha = String(raw || '').trim();
    if (/^[0-9a-f]{40}$/i.test(sha)) return sha;
  }
  return '';
}

export function laneDeployArgs(lane, env = process.env, spawn = spawnSync) {
  const config = assertLaneDeployContext(lane, env, spawn);
  const args = ['wrangler', 'deploy', '--env', config.environment];
  const sha = resolveDeploySha(env);
  if (sha) {
    args.push('--tag', sha, '--message', `git:${sha}`);
  }
  return args;
}

export function runLaneDeploy(lane, { env = process.env, spawn = spawnSync } = {}) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawn(command, laneDeployArgs(lane, env, spawn), {
    env,
    stdio: 'inherit',
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
