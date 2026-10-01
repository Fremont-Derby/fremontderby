import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('page note is present', () => {
  const source = fs.readFileSync(new URL('../src/adminPlayersPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-no-hard-delete/);
});
