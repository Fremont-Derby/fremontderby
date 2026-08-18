import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/gamma-rc-validation.yml', import.meta.url),
  'utf8',
);

test('gamma-rc-validation workflow name and scripts', () => {
  assert.match(workflow, /^name:\s*Gamma RC validation\s*$/m);
  assert.match(workflow, /validate-gamma-rc\.mjs/);
  assert.match(workflow, /check-release-source-policy\.mjs/);
});
