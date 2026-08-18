import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/staging-readiness.yml', import.meta.url),
  'utf8',
);

test('staging-readiness workflow has expected name', () => {
  assert.match(workflow, /^name:\s*Staging readiness\s*$/m);
});
