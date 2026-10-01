import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('score picker names the common save failure', () => {
  const source = fs.readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-score-error/);
  assert.match(source, /already be finalized/);
});
