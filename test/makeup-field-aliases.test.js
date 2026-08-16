import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('propose makeup accepts on/location/note aliases', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(src, /body\.on \?\? body\.proposedOn/);
  assert.match(src, /body\.location \?\? body\.venue/);
  assert.match(src, /body\.note \?\? body\.message/);
});
