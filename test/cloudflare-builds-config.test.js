import assert from 'node:assert/strict';
import test from 'node:test';
import {
  choosePrimaryTrigger,
  desiredTriggerPatch,
  findWorkerScript,
  planWorkerTriggerChanges,
  stateMatchesDesired,
} from '../scripts/configure-cloudflare-builds.mjs';

const desiredJfl = Object.freeze({
  workerNames: ['fremontderby-jfl'],
  branch: 'fremontderby-jfl',
  buildCommand: 'node scripts/guard-cloudflare-build.mjs jfl',
  deployCommand: 'npm run deploy:jfl',
  buildLane: 'jfl',
});

test('findWorkerScript uses ordered exact worker-name candidates', () => {
  const scripts = [
    { id: 'fremontderby', tag: 'prod-old' },
    { id: 'fremontderby-prod', tag: 'prod-new' },
  ];
  assert.equal(findWorkerScript(scripts, ['fremontderby-prod', 'fremontderby']).tag, 'prod-new');
});

test('choosePrimaryTrigger prefers the exact permanent branch trigger', () => {
  const triggers = [
    {
      trigger_uuid: 'preview',
      trigger_name: 'Preview',
      branch_includes: ['*'],
      branch_excludes: ['fremontderby-jfl'],
    },
    {
      trigger_uuid: 'release',
      trigger_name: 'Production',
      branch_includes: ['fremontderby-jfl'],
      branch_excludes: [],
    },
  ];
  assert.equal(choosePrimaryTrigger(triggers, desiredJfl).trigger_uuid, 'release');
});

test('plan deletes preview triggers and requires explicit lane deploy command', () => {
  const patch = desiredTriggerPatch(desiredJfl);
  const triggers = [
    {
      trigger_uuid: 'release',
      trigger_name: 'Production',
      branch_includes: ['fremontderby-jfl'],
      branch_excludes: [],
      path_includes: ['*'],
      path_excludes: [],
      build_command: 'npm run build',
      deploy_command: 'npx wrangler deploy',
      root_directory: '/',
    },
    {
      trigger_uuid: 'preview',
      trigger_name: 'Preview',
      branch_includes: ['*'],
      branch_excludes: ['fremontderby-jfl'],
    },
  ];
  const plan = planWorkerTriggerChanges(triggers, desiredJfl);
  assert.equal(plan.primary.trigger_uuid, 'release');
  assert.deepEqual(plan.extras.map((row) => row.trigger_uuid), ['preview']);
  assert.equal(plan.triggerNeedsPatch, true);
  assert.deepEqual(patch.branch_includes, ['fremontderby-jfl']);
  assert.equal(patch.deploy_command, 'npm run deploy:jfl');
  assert.equal(patch.build_command, 'node scripts/guard-cloudflare-build.mjs jfl');
});

test('desired state requires no preview trigger and matching lane build variable', () => {
  const patch = desiredTriggerPatch(desiredJfl);
  const primary = { trigger_uuid: 'release', ...patch };
  const state = {
    plan: { primary, extras: [], triggerNeedsPatch: false },
    env: { FREMONT_BUILD_LANE: { value: 'jfl', is_secret: false } },
  };
  assert.equal(stateMatchesDesired(state, desiredJfl), true);
  state.plan.extras.push({ trigger_uuid: 'preview' });
  assert.equal(stateMatchesDesired(state, desiredJfl), false);
});

test('ambiguous trigger sets fail closed instead of guessing', () => {
  const triggers = [
    { trigger_uuid: 'a', trigger_name: 'Preview A', branch_includes: ['*'] },
    { trigger_uuid: 'b', trigger_name: 'Preview B', branch_includes: ['*'] },
  ];
  assert.throws(() => choosePrimaryTrigger(triggers, desiredJfl), /Refusing ambiguous mutation/);
});
