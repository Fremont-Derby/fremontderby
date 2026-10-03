import test from 'node:test';
import assert from 'node:assert/strict';
import { codeqlConfig, deployCommand, publicBuild, releaseTrain, workerStamp } from '../src/trainOps.js';

test('a release train slice must be tested on DRU', () => {
  assert.equal(releaseTrain({ tested: true, lane: 'dru' }).ready, true);
  assert.equal(releaseTrain({ tested: false, lane: 'dru' }).ready, false);
});

test('a query pack name cannot contain a space', () => {
  assert.equal(codeqlConfig('javascript').ok, true);
  assert.equal(codeqlConfig('bad pack').ok, false);
});

test('a deploy command must name the lane', () => {
  assert.equal(deployCommand('wrangler deploy --env dru').ok, true);
  assert.equal(deployCommand('wrangler deploy').ok, false);
});

test('a lane worker is not stamped as production', () => {
  assert.equal(workerStamp({ name: 'fremontderby-production' }).ok, false);
});

test('a public PR cannot start a production build', () => {
  assert.equal(publicBuild('public-pr').ok, false);
});
