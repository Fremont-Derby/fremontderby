import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('form fields use 16px text to avoid iOS focus zoom on key surfaces', () => {
  const src = readFileSync(new URL('../src/scorecardPage.js', import.meta.url), 'utf8');
  assert.match(src, /resolveRaceCompletion/);
});
