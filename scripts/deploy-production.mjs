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
  // Top-level wrangler.jsonc Worker (production apex routes).
  // Do not pass --env "" — wrangler treats that as a missing argument.
  const args = ['wrangler', 'deploy'];

  // Prefer CI full SHAs; DEPLOY_GIT_SHA remains a local/canary fallback.
  const commitSha = String(
    env.WORKERS_CI_COMMIT_SHA || env.GITHUB_SHA || env.DEPLOY_GIT_SHA || '',
  ).trim();
  // Tag only full 40-char SHAs (CI contract). Still expose shorter local SHAs via --var when present.
  if (/^[0-9a-f]{40}$/i.test(commitSha)) {
    args.push('--tag', commitSha, '--message', `git:${commitSha}`);
  }
  if (commitSha && /^[0-9a-f]{7,40}$/i.test(commitSha)) {
    // CF_VERSION_METADATA.tag is often empty even with --tag; expose SHA to /health via var.
    args.push('--var', `DEPLOY_GIT_SHA:${commitSha}`);
  }

  return args;
}

export function runProductionDeploy({ env = process.env, spawn = spawnSync } = {}) {
  // Embed git SHA into the Worker bundle so /health versionTag cannot be dropped by var binding alone.
  const stamp = spawn(process.execPath, ['scripts/stamp-deploy-identity.mjs'], {
    env,
    stdio: 'inherit',
    shell: false,
  });
  if (stamp.error) throw stamp.error;
  if (stamp.status !== 0 && stamp.status != null) {
    process.exitCode = stamp.status;
    return;
  }

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
