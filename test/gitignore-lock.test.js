import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../.gitignore', import.meta.url), 'utf8');

test('gitignore excludes wrangler local state', () => {
  assert.match(source, /^\.wrangler\/?$/m);
});

test('gitignore excludes env and secret local files', () => {
  assert.match(source, /^\.env$/m);
  assert.match(source, /^\.dev\.vars$/m);
  assert.match(source, /^node_modules\/?$/m);
});
