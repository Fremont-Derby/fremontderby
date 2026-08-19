import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  WORKERS_BUILDS_PROJECTS,
  workersBuildLanes,
  assertWorkersBuildsAlignWithGuardAllowlists,
} from '../scripts/workers-builds-commands.mjs';
import { LANE_BRANCH_ALLOWLISTS } from '../scripts/guard-cloudflare-build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('Workers Builds projects cover production + every guard lane', () => {
  assert.deepEqual(workersBuildLanes().sort(), Object.keys(LANE_BRANCH_ALLOWLISTS).sort());
  assert.doesNotThrow(() => assertWorkersBuildsAlignWithGuardAllowlists());
});

test('each Workers Builds project uses prebuild + lane-specific deploy script', () => {
  for (const [lane, project] of Object.entries(WORKERS_BUILDS_PROJECTS)) {
    assert.equal(project.fremontBuildLane, lane);
    assert.match(project.buildCommand, /npm run prebuild/);
    if (lane === 'production') {
      assert.match(project.buildCommand, /deploy:production/);
      assert.deepEqual([...project.branchAllowlist], ['main']);
    } else {
      assert.match(project.buildCommand, new RegExp(`deploy:${lane}`));
      assert.ok(project.branchAllowlist.includes(`fremontderby-${lane}`));
    }
  }
});

test('docs list explicit lane deploy commands (not bare wrangler deploy)', () => {
  const docs = readFileSync(join(root, 'docs/cloudflare-builds-isolation.md'), 'utf8');
  assert.match(docs, /deploy:production/);
  assert.match(docs, /deploy:jfl/);
  assert.match(docs, /deploy:dru/);
  assert.match(docs, /deploy:gamma/);
  assert.match(docs, /FREMONT_BUILD_LANE/);
});
