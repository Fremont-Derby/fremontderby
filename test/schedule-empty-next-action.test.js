import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('an empty league night points to lineup', () => {
  const source = fs.readFileSync(new URL('../src/schedulePage.js', import.meta.url), 'utf8');
  assert.match(source, /Open lineup to see who is playing/);
});
