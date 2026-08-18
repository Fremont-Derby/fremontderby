import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/stamp-deploy-identity.mjs', import.meta.url), 'utf8');

test('stamp-deploy-identity targets routerEntry.js', () => {
  assert.match(source, /src\/routerEntry\.js/);
});

test('stamp-deploy-identity rewrites STAMPED_DEPLOY markers', () => {
  assert.match(source, /STAMPED_DEPLOY_GIT_SHA/);
  assert.match(source, /STAMPED_DEPLOY_AT/);
});
