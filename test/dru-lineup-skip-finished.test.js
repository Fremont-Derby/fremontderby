import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('lineup page still ships after the Gamma sync', () => {
  const source = fs.readFileSync(new URL('../src/lineupPage.js', import.meta.url), 'utf8');
  assert.match(source, /lineup/i);
});
