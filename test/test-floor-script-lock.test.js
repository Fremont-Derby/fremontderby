import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;

test('test:floor runs count-tests.mjs', () => {
  assert.equal(scripts['test:floor'], 'node scripts/count-tests.mjs');
});

test('CI workflow also enforces count-tests.mjs', () => {
  const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(ci, /count-tests\.mjs/);
});
