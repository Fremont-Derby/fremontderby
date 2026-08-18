import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function requireValue(env, name, source) {
  const value = String(env[name] || '').trim();
  if (!value) {
    throw new Error(`Refusing production deploy: ${source} did not provide ${name}.`);
  }
  return value;
}

export function assertProductionDeployContext(env = process.env) {
  if (env.GITHUB_ACTIONS === 'true') {
    const branch = requireValue(env, 'GITHUB_REF_NAME', 'GitHub Actions');
    if (branch !== 'main') {
      throw new Error(
        `Refusing production deploy from non-production branch "${branch}"; expected "main".`,
      );
    }
    return;
  }

  if (env.WORKERS_CI !== '1') return;

  const branch = requireValue(env, 'WORKERS_CI_BRANCH', 'Workers Builds');
  if (branch !== 'main') {
    throw new Error(
      `Refusing production deploy from non-production branch "${branch}". ` +
      'Cloudflare preview branches must use the preview deploy command instead.',
    );
  }

  const commitSha = requireValue(env, 'WORKERS_CI_COMMIT_SHA', 'Workers Builds');
  if (!/^[0-9a-f]{40}$/i.test(commitSha)) {
    throw new Error('Refusing production deploy: WORKERS_CI_COMMIT_SHA is not a full Git SHA.');
  }
}

export function productionDeployArgs(env = process.env) {
  assertProductionDeployContext(env);
  const args = ['wrangler', 'deploy'];

  const commitSha = String(env.WORKERS_CI_COMMIT_SHA || env.GITHUB_SHA || '').trim();
  if (/^[0-9a-f]{40}$/i.test(commitSha)) {
    args.push('--tag', commitSha, '--message', `git:${commitSha}`);
  }

  return args;
}

export function runProductionDeploy({ env = process.env, spawn = spawnSync } = {}) {
  const isWin = process.platform === 'win32';
  const result = spawn(isWin ? 'npx' : 'npx', productionDeployArgs(env), {
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
    runProductionDeploy();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
