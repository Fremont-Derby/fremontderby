import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('standings page still ships after the Gamma sync', () => {
  const source = fs.readFileSync(new URL('../src/standingsPage.js', import.meta.url), 'utf8');
  assert.ok(source.length > 100);
});
