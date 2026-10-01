import { fileURLToPath } from 'node:url';

/**
 * Fail-closed branch allowlists for Cloudflare Workers Builds.
 *
 * WHY (#727 / #732 / #873): connected CF projects were starting builds for every PR branch.
 * Dashboard branch filters are the primary control; this guard is a second line so the
 * wrong project cannot publish even if a build starts.
 *
 * Each Workers Builds project should set FREMONT_BUILD_LANE to one of:
 * production | jfl | dru | gamma
 * and use a build command that runs `npm run prebuild` / this script before deploy.
 */

export const LANE_BRANCH_ALLOWLISTS = Object.freeze({
  production: Object.freeze([/^main$/]),
  jfl: Object.freeze([/^fremontderby-jfl$/, /^jfl\//]),
  dru: Object.freeze([/^fremontderby-dru$/, /^dru\//]),
  gamma: Object.freeze([/^fremontderby-gamma$/, /^gamma\//]),
});

/** Branch shapes that must never publish any lane (PR heads, automation noise). */
export const GLOBAL_REFUSE_BRANCH_PATTERNS = Object.freeze([
  /^pull\/\d+\/(head|merge)$/i,
  /^refs\/pull\//i,
  /^dependabot\//i,
  /^renovate\//i,
]);

function requireWorkersBuildValue(env, name) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Refusing Cloudflare build: Workers Builds did not provide ${name}.`);
  }
  return value;
}

export function resolveBuildLane(env = process.env, explicitLane) {
  const raw = String(explicitLane || env.FREMONT_BUILD_LANE || 'production').trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(LANE_BRANCH_ALLOWLISTS, raw)) {
    throw new Error(
      `Refusing Cloudflare build: unknown FREMONT_BUILD_LANE "${raw}". ` +
        `Expected one of: ${Object.keys(LANE_BRANCH_ALLOWLISTS).join(', ')}.`,
    );
  }
  return raw;
}

export function branchAllowedForLane(branch, lane) {
  const normalized = String(branch || '').replace(/^refs\/heads\//, '');
  if (GLOBAL_REFUSE_BRANCH_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false;
  }
  const patterns = LANE_BRANCH_ALLOWLISTS[lane] || LANE_BRANCH_ALLOWLISTS.production;
  return patterns.some((pattern) => pattern.test(normalized));
}

export function assertCloudflareBuildContext(env = process.env, explicitLane) {
  if (env.WORKERS_CI !== '1') return;

  const lane = resolveBuildLane(env, explicitLane);
  const branch = requireWorkersBuildValue(env, 'WORKERS_CI_BRANCH');

  // Optional CF/Git metadata when present — refuse PR events even if branch name is wrong.
  const event = String(env.WORKERS_CI_EVENT || env.CF_PAGES_EVENT_TYPE || '').toLowerCase();
  if (event.includes('pull_request') || event === 'pull_request') {
    throw new Error(
      `Refusing Cloudflare ${lane} build for pull_request event. ` +
        'Workers Builds must not deploy from PRs; use branch filters + this guard.',
    );
  }

  if (!branchAllowedForLane(branch, lane)) {
    const allowed = LANE_BRANCH_ALLOWLISTS[lane].map((re) => re.toString()).join(', ');
    throw new Error(
      `Refusing Cloudflare ${lane} build from branch "${branch}". ` +
        `Allowed patterns: ${allowed}. ` +
        'Configure Workers Builds branch controls so only matching branches start this project, ' +
        'and set FREMONT_BUILD_LANE on the project (#873).',
    );
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  try {
    assertCloudflareBuildContext(process.env, process.argv[2]);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
