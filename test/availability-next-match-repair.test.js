import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('availability repair module remains present after the Gamma sync', () => {
  const source = fs.readFileSync(new URL('../src/availabilityScriptRepair.js', import.meta.url), 'utf8');
  assert.match(source, /availability/i);
});
