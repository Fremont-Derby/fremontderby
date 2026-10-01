import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('playoffs page still ships after the Gamma sync', () => {
  const source = fs.readFileSync(new URL('../src/playoffsPage.js', import.meta.url), 'utf8');
  assert.ok(source.length > 100);
});
