/**
 * Source of truth for Cloudflare Workers Builds project commands (#1192 / #873).
 * Dashboard build commands should match these strings so root profile deploys
 * cannot cross lanes even when branch filters lag.
 */
import { LANE_BRANCH_ALLOWLISTS } from './guard-cloudflare-build.mjs';

export const WORKERS_BUILDS_PROJECTS = Object.freeze({
  production: Object.freeze({
    projectHint: 'fremontderby-prod',
    fremontBuildLane: 'production',
    branchAllowlist: Object.freeze(['main']),
    // Production uses deploy-production guards (main + full SHA under Workers CI).
    buildCommand: 'npm ci && npm run prebuild && npm run deploy:production',
  }),
  jfl: Object.freeze({
    projectHint: 'fremontderby-jfl',
    fremontBuildLane: 'jfl',
    branchAllowlist: Object.freeze(['fremontderby-jfl', 'jfl/*']),
    buildCommand: 'npm ci && npm run prebuild && npm run deploy:jfl',
  }),
  dru: Object.freeze({
    projectHint: 'fremontderby-dru',
    fremontBuildLane: 'dru',
    branchAllowlist: Object.freeze(['fremontderby-dru', 'dru/*']),
    buildCommand: 'npm ci && npm run prebuild && npm run deploy:dru',
  }),
  gamma: Object.freeze({
    projectHint: 'fremontderby-gamma',
    fremontBuildLane: 'gamma',
    branchAllowlist: Object.freeze(['fremontderby-gamma', 'gamma/*']),
    buildCommand: 'npm ci && npm run prebuild && npm run deploy:gamma',
  }),
});

export function workersBuildLanes() {
  return Object.keys(WORKERS_BUILDS_PROJECTS);
}

export function assertWorkersBuildsAlignWithGuardAllowlists() {
  const errors = [];
  for (const lane of workersBuildLanes()) {
    if (!LANE_BRANCH_ALLOWLISTS[lane]) {
      errors.push(`WORKERS_BUILDS_PROJECTS lane "${lane}" missing from LANE_BRANCH_ALLOWLISTS`);
    }
    const project = WORKERS_BUILDS_PROJECTS[lane];
    if (project.fremontBuildLane !== lane) {
      errors.push(`${lane} fremontBuildLane must equal lane key`);
    }
    if (!String(project.buildCommand).includes('npm run prebuild')) {
      errors.push(`${lane} buildCommand must run npm run prebuild`);
    }
    if (lane === 'production') {
      if (!project.buildCommand.includes('deploy:production')) {
        errors.push('production buildCommand must use deploy:production');
      }
    } else if (!project.buildCommand.includes(`deploy:${lane}`)) {
      errors.push(`${lane} buildCommand must use deploy:${lane}`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return true;
}
