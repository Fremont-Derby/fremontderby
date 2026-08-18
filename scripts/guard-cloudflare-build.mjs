import { fileURLToPath } from 'node:url';

export const CLOUDFLARE_BUILD_BRANCHES = Object.freeze([
  'main',
  'fremontderby-jfl',
  'fremontderby-dru',
  'fremontderby-gamma',
]);

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
  if (!CLOUDFLARE_BUILD_BRANCHES.includes(branch)) {
    throw new Error(
      `Refusing Cloudflare build from unrecognized branch "${branch}". ` +
      'Workers Builds are allowed only from main or a permanent release-lane branch.',
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
