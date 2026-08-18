import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/codeql.yml', import.meta.url), 'utf8');

test('CodeQL workflow has expected name', () => {
  assert.match(workflow, /^name:\s*CodeQL\s*$/m);
});
