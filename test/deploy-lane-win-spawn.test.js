import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('runLaneDeploy uses shell on win32', () => {
  const src = readFileSync(new URL('../scripts/deploy-lane.mjs', import.meta.url), 'utf8');
  assert.match(src, /shell:\s*isWin/);
  assert.doesNotMatch(src, /npx\.cmd/);
});
