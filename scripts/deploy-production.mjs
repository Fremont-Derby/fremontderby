import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function requireWorkersBuildValue(env, name) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Refusing production deploy: Workers Builds did not provide ${name}.`);
  }
  return value;
}

export function assertProductionDeployContext(env = process.env) {
  if (env.WORKERS_CI !== '1') return;

  const branch = requireWorkersBuildValue(env, 'WORKERS_CI_BRANCH');
  if (branch !== 'main') {
    throw new Error(
      `Refusing production deploy from non-production branch "${branch}". ` +
      'Cloudflare preview branches must use the preview deploy command instead.',
    );
  }

  const commitSha = requireWorkersBuildValue(env, 'WORKERS_CI_COMMIT_SHA');
  if (!/^[0-9a-f]{40}$/i.test(commitSha)) {
    throw new Error('Refusing production deploy: WORKERS_CI_COMMIT_SHA is not a full Git SHA.');
  }
}

export function productionDeployArgs(env = process.env) {
  assertProductionDeployContext(env);
  const args = ['wrangler', 'deploy'];

  if (env.WORKERS_CI === '1') {
    const commitSha = env.WORKERS_CI_COMMIT_SHA.trim();
    args.push('--tag', commitSha, '--message', `git:${commitSha}`);
  }

  return args;
}

export function runDemoSeedIfConfigured({ env = process.env, spawn = spawnSync } = {}) {
  if (env.SEED_DEMO_ON_DEPLOY !== '1') return;

  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SEED_ACTOR_USER_ID']
    .filter((name) => !env[name]?.trim());
  if (missing.length) {
    throw new Error(
      `SEED_DEMO_ON_DEPLOY=1 requires ${missing.join(', ')} in the deploy environment.`,
    );
  }

  console.log('SEED_DEMO_ON_DEPLOY=1 — running idempotent demo league seed after Worker deploy');
  const result = spawn(process.execPath, ['scripts/seed-demo-league.mjs'], {
    env: {
      ...env,
      SEED_APPLY: '1',
      SEED_SCENARIO: env.SEED_SCENARIO?.trim() || 'active',
    },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Demo league seed failed with exit code ${result.status ?? 1}`);
  }
}

export function runProductionDeploy({ env = process.env, spawn = spawnSync } = {}) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawn(command, productionDeployArgs(env), {
    env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return;
  }

  runDemoSeedIfConfigured({ env, spawn });
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
