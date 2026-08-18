import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('routerEntry /health reports service fremontderby', () => {
  const source = readFileSync('src/routerEntry.js', 'utf8');
  assert.match(source, /service:\s*'fremontderby'/);
  assert.match(source, /pathname === '\/health'/);
  assert.match(source, /versionTag/);
});
