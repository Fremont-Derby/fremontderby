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

  // Controlled deploys from main (Actions or operator laptop) after explicit review.
  if (env.FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN === '1') {
    return config;
  }

  const branch = resolveDeployBranch(env, spawn);
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
  const sha = String(env.GITHUB_SHA || '').trim();
  if (/^[0-9a-f]{40}$/i.test(sha)) {
    args.push('--tag', sha, '--message', `git:${sha}`);
  }
  return args;
}

export function runLaneDeploy(lane, { env = process.env, spawn = spawnSync } = {}) {
  // Windows: spawnSync('npx.cmd', ...) often returns EINVAL without shell.
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
