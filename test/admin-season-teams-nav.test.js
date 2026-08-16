import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('admin season teams has score nav and empty recovery', () => {
  const src = readFileSync(new URL('../src/adminSeasonTeamsPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/season-setup"/);
  assert.match(src, /Season setup/);
});
