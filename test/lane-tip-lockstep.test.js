import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('deploy-release-lanes defaults to all-lanes', () => {
  const yml = readFileSync(new URL('../.github/workflows/deploy-release-lanes.yml', import.meta.url), 'utf8');
  assert.match(yml, /default:\s*'all-lanes'/);
});

test('ENVIRONMENTS documents tip lockstep', () => {
  const md = readFileSync(new URL('../docs/ENVIRONMENTS.md', import.meta.url), 'utf8');
  assert.match(md, /Lane tip lockstep/);
  assert.match(md, /same Worker tip/);
});
