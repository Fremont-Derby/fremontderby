import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('gateway names the workflow health list', () => {
  const source = fs.readFileSync(new URL('../src/adminGatewayPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-workflow-health/);
});
