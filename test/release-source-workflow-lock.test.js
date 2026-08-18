import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/release-source-policy.yml', import.meta.url),
  'utf8',
);

test('release-source-policy workflow name and script', () => {
  assert.match(workflow, /^name:\s*Release source policy\s*$/m);
  assert.match(workflow, /check-release-source-policy\.mjs/);
});
