import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const workflowsDir = new URL('../.github/workflows/', import.meta.url);
const files = readdirSync(workflowsDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));

const DEPLOY_TOUCHING = [
  'deploy-release-lanes.yml',
  'restore-lane-custom-domains.yml',
  'fix-jfl-supabase-bindings.yml',
  'gamma-prod-refresh.yml',
];

test('deploy-touching workflows never trigger on pull_request', () => {
  for (const name of DEPLOY_TOUCHING) {
    const text = readFileSync(new URL(name, workflowsDir), 'utf8');
    // crude but effective: on: block should not list pull_request for these
    assert.doesNotMatch(
      text,
      /^on:\s*\n(?:  .*\n)*  pull_request\b/m,
      `${name} must not use pull_request trigger`,
    );
    assert.doesNotMatch(
      text,
      /on:\s*\[[^\]]*pull_request/,
      `${name} must not list pull_request in on: array`,
    );
  }
});

test('deploy-release-lanes is workflow_dispatch only', () => {
  const text = readFileSync(new URL('deploy-release-lanes.yml', workflowsDir), 'utf8');
  assert.match(text, /workflow_dispatch:/);
  assert.doesNotMatch(text, /^\s+push:\s*$/m);
  assert.doesNotMatch(text, /pull_request:/);
});

test('guard refuses jfl feature branch for production lane', async () => {
  const { assertCloudflareBuildContext } = await import('../scripts/guard-cloudflare-build.mjs');
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'jfl/issue-999-feature',
      FREMONT_BUILD_LANE: 'production',
    }),
    /Refusing Cloudflare production build/,
  );
});
