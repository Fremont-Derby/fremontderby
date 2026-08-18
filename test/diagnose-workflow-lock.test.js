import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/diagnose-worker-domains.yml', import.meta.url),
  'utf8',
);

test('diagnose-worker-domains workflow name and script', () => {
  assert.match(workflow, /^name:\s*Diagnose worker domains\s*$/m);
  assert.match(workflow, /diagnose-worker-domains\.mjs/);
});
