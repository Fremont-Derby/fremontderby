import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { resolveDeployBranch, runLaneDeploy } from './deploy-lane.mjs';
import { runProductionDeploy } from './deploy-production.mjs';

export const branchDeployments = Object.freeze({
  main: 'production',
  'fremontderby-jfl': 'jfl',
  'fremontderby-dru': 'dru',
  'fremontderby-gamma': 'gamma',
});

export function resolveDeployTarget(env = process.env, spawn = spawnSync) {
  const branch = resolveDeployBranch(env, spawn);
  const target = branchDeployments[branch];
  if (!target) {
    throw new Error(
      `Refusing Cloudflare deploy from unrecognized branch "${branch}". ` +
      'Deployments are allowed only from main or a permanent release-lane branch.',
    );
  }
  return Object.freeze({ branch, target });
}

export function runCloudflareDeploy({ env = process.env, spawn = spawnSync } = {}) {
  const { target } = resolveDeployTarget(env, spawn);
  if (target === 'production') {
    return runProductionDeploy({ env, spawn });
  }
  return runLaneDeploy(target, { env, spawn });
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  try {
    runCloudflareDeploy();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
