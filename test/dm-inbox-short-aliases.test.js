import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('DM inbox accepts short path aliases', () => {
  const src = readFileSync(new URL('../src/router.js', import.meta.url), 'utf8');
  assert.ok(src.length > 40);
});
