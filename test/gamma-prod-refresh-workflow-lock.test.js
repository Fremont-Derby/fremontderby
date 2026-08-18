import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/gamma-prod-refresh.yml', import.meta.url),
  'utf8',
);

test('gamma-prod-refresh workflow name and script', () => {
  assert.match(workflow, /^name:\s*Gamma prod refresh\s*$/m);
  assert.match(workflow, /gamma-prod-refresh\.mjs/);
});
