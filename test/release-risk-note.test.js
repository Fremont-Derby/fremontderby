import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('season setup names the release risk note', () => {
  const source = fs.readFileSync(new URL('../src/seasonSetupPage.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /data-release-risk/);
  assert.doesNotMatch(source, /league night can still be scored/);
});
