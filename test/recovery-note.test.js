import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('support names the recovery note', () => {
  const source = fs.readFileSync(new URL('../src/adminSupportPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-recovery-note/);
});
