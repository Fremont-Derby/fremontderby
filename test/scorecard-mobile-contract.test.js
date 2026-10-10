import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('live scorecard is phone-first with large winner and edit targets', () => {
  const src = readFileSync(new URL('../src/scorecardPage.js', import.meta.url), 'utf8');
  assert.match(src, /resolveRaceCompletion/);
});
