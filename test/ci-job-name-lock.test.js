import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('CI workflow exposes CI / test check context', () => {
  const src = read('.github/workflows/ci.yml');
  assert.match(src, /^name:\s*CI\s*$/m);
  // GitHub check name is "{workflow} / {job.name}"
  assert.match(src, /^\s{4}name:\s*test\s*$/m);
});

test('PR card contract workflow keeps its required name', () => {
  const src = read('.github/workflows/pr-card-contract.yml');
  assert.match(src, /^name:\s*PR card contract\s*$/m);
  assert.match(src, /^\s{4}name:\s*pr-card-contract\s*$/m);
});
