import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('page note is present', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, /scorePickerRetryAfterSeconds/);
});
