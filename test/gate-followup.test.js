import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('availability names what fails a gate', () => {
  const source = fs.readFileSync(new URL('../src/availabilityPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-gate-followup/);
});
