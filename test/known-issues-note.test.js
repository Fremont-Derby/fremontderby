import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('rules page tells testers where non-blocking issues live', () => {
  const source = fs.readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  assert.match(source, /data-known-issues/);
  assert.match(source, /do not stop league night/);
});
