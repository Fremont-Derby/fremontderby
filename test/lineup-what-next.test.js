import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('lineup tells a stuck tester the next action', () => {
  const source = fs.readFileSync(new URL('../src/lineupPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-what-next/);
  assert.match(source, /set your lineup/);
});
