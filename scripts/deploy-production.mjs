import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function assertProductionDeployContext(env = process.env) {
  if (env.WORKERS_CI !== '1') return;

  const branch = env.WORKERS_CI_BRANCH?.trim();
  if (!branch) {
    throw new Error('Refusing production deploy: Workers Builds did not provide WORKERS_CI_BRANCH.');
  }

  if (branch !== 'main') {
    throw new Error(
      `Refusing production deploy from non-production branch "${branch}". ` +
      'Cloudflare preview branches must use the preview deploy command instead.',
    );
  }
}

export function runProductionDeploy({ env = process.env, spawn = spawnSync } = {}) {
  assertProductionDeployContext(env);

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawn(command, ['wrangler', 'deploy'], {
    env,
    stdio: 'inherit',
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
