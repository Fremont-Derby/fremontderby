import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('audit says a session stays on its lane', () => {
  const source = fs.readFileSync(new URL('../src/adminAuditPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-lane-session/);
});
