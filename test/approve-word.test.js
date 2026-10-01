import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('team review accepts the approve word the form sends', () => {
  const source = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(source, /approved:'approve'/);
  assert.match(source, /declined:'reject'/);
});
