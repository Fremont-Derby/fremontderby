import { fileURLToPath } from 'node:url';

function requireWorkersBuildValue(env, name) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Refusing Cloudflare build: Workers Builds did not provide ${name}.`);
  }
  return value;
}

export function assertCloudflareBuildContext(env = process.env) {
  if (env.WORKERS_CI !== '1') return;

  const branch = requireWorkersBuildValue(env, 'WORKERS_CI_BRANCH');
  if (branch !== 'main') {
    throw new Error(
      `Refusing Cloudflare build from non-main branch "${branch}". ` +
      'Non-main Workers Builds are temporarily disabled until Cloudflare Branch control routes them to preview-only deployment.',
    );
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  try {
    assertCloudflareBuildContext();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
