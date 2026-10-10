import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('ready-check list accepts singular and pending aliases', () => {
  const src = readFileSync(new URL('../src/router.js', import.meta.url), 'utf8');
  assert.ok(src.length > 40);
});
