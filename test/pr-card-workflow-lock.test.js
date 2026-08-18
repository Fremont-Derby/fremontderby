import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/pr-card-contract.yml', import.meta.url),
  'utf8',
);

test('pr-card-contract workflow name and script', () => {
  assert.match(workflow, /^name:\s*PR card contract\s*$/m);
  assert.match(workflow, /check-pr-card-contract\.mjs/);
});
