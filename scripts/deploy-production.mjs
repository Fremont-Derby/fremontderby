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
  if (env.GITHUB_ACTIONS === 'true') {
    const branch = String(env.GITHUB_REF_NAME || '').trim();
    if (!branch) {
      throw new Error('Refusing production deploy: GitHub Actions did not provide GITHUB_REF_NAME.');
    }
    if (branch !== 'main') {
      throw new Error(
        `Refusing production deploy from non-production branch "${branch}"; expected "main".`,
      );
    }
  }

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
  // Top-level wrangler.jsonc Worker (production apex routes).
  // Do not pass --env "" — wrangler treats that as a missing argument.
  const args = ['wrangler', 'deploy'];

  const commitSha = String(
    env.WORKERS_CI_COMMIT_SHA || env.GITHUB_SHA || env.DEPLOY_GIT_SHA || '',
  ).trim();
  if (commitSha && /^[0-9a-f]{7,40}$/i.test(commitSha)) {
    args.push('--tag', commitSha, '--message', `git:${commitSha}`);
    // CF_VERSION_METADATA.tag is often empty even with --tag; expose SHA to /health via var.
    args.push('--var', `DEPLOY_GIT_SHA:${commitSha}`);
  }

  return args;
}

export function runProductionDeploy({ env = process.env, spawn = spawnSync } = {}) {
  // Embed git SHA into the Worker bundle so /health versionTag cannot be dropped by var binding.
  const stamp = spawn(process.execPath, ['scripts/stamp-deploy-identity.mjs'], {
    env,
    stdio: 'inherit',
    shell: false,
  });
  if (stamp.error) throw stamp.error;

  // Windows: spawnSync('npx.cmd', ...) often returns EINVAL without shell (same as deploy-lane.mjs).
  const isWin = process.platform === 'win32';
  const result = spawn(isWin ? 'npx' : 'npx', productionDeployArgs(env), {
    env,
    encoding: 'utf8',
    shell: isWin,
  });

  if (result.error) throw result.error;
  const out = `${result.stdout || ''}\n${result.stderr || ''}`;
  if (out.trim()) process.stdout.write(out);
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return;
  }

  const match = out.match(/Current Version ID:\s*([0-9a-f-]{36})/i);
  const expectedId = match?.[1] || null;
  if (!expectedId) {
    console.warn('Could not parse Current Version ID from wrangler output; skipping live-version wait');
    return;
  }
  console.log('Waiting for production /health to serve version', expectedId);
  const started = Date.now();
  const deadline = started + 90_000;
  while (Date.now() < deadline) {
    try {
      const probe = spawn(
        process.execPath,
        [
          '-e',
          `fetch('https://fremontderby.com/health').then(r=>r.json()).then(b=>{console.log(JSON.stringify(b)); process.exit(b.version===process.env.EXPECTED_ID?0:2)}).catch(()=>process.exit(3))`,
        ],
        {
          env: { ...env, EXPECTED_ID: expectedId },
          encoding: 'utf8',
          shell: false,
        },
      );
      if (probe.stdout) process.stdout.write(probe.stdout);
      if (probe.status === 0) {
        console.log('Live production version matches deploy', expectedId);
        return;
      }
    } catch (err) {
      console.warn('live version probe error', err instanceof Error ? err.message : err);
    }
    spawn(process.execPath, ['-e', 'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,3000)'], {
      shell: false,
    });
  }
  console.warn(
    `Live /health did not reach version ${expectedId} within 90s — traffic may still be on a prior Worker version`,
  );
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
