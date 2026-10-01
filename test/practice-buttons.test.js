import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('practice buttons tell the tester what happened', () => {
  const demo = readFileSync(new URL('../src/demoSeasonPage.js', import.meta.url), 'utf8');
  const captain = readFileSync(new URL('../src/captainSandboxPage.js', import.meta.url), 'utf8');
  assert.match(demo, /Practice mission started/);
  assert.match(captain, /Practice handoff recorded/);
  assert.match(captain, /Theo Martin/);
});
