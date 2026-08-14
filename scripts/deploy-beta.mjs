import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ALLOWED = new Set(['beta-jfl', 'beta-dru', 'gamma']);

/**
 * Deploy a non-production lane: beta-jfl | beta-dru | gamma
 * Usage: node scripts/deploy-beta.mjs beta-jfl
 */
export function runLaneDeploy(lane, { env = process.env, spawn = spawnSync } = {}) {
  if (!ALLOWED.has(lane)) {
    throw new Error(`Unsupported lane "${lane}". Use: ${[...ALLOWED].join(', ')}`);
  }

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawn(command, ['wrangler', 'deploy', '--env', lane], {
    env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  try {
    const lane = process.argv[2] || 'beta-jfl';
    runLaneDeploy(lane);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
