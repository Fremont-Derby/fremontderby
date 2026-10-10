import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('professional polish layer is present', () => {
  const src = readFileSync(new URL('../src/designSystem.js', import.meta.url), 'utf8');
  assert.match(src, /designSystemStyles/);
});
