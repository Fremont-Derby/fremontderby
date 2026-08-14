import { fileURLToPath } from 'node:url';

const JFL_DEPLOYMENT_BRANCH = 'fremontderby-jfl';

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
  if (branch !== JFL_DEPLOYMENT_BRANCH) {
    throw new Error(
      `Refusing JFL Cloudflare build from branch "${branch}"; expected "${JFL_DEPLOYMENT_BRANCH}".`,
    );
  }
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  try {
    assertCloudflareBuildContext();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
