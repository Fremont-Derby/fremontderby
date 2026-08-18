import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/enforce-workers-dev-disabled.yml', import.meta.url),
  'utf8',
);

test('enforce-workers-dev-disabled workflow is named correctly', () => {
  assert.match(workflow, /^name:\s*Enforce workers\.dev disabled\s*$/m);
});

test('enforce-workers-dev-disabled runs disable-workers-dev script', () => {
  assert.match(workflow, /scripts\/disable-workers-dev\.mjs/);
});
