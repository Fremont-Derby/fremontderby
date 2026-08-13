import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Deploy the Worker to the wrangler `beta` environment only.
 * Never targets production. Author must configure beta vars/secrets first.
 */
export function runBetaDeploy({ env = process.env, spawn = spawnSync } = {}) {
  if (env.ENVIRONMENT === 'production' && env.FORCE_BETA_DEPLOY !== '1') {
    // informational only; wrangler --env beta is the real guard
  }

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawn(command, ['wrangler', 'deploy', '--env', 'beta'], {
    env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  try {
    runBetaDeploy();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
