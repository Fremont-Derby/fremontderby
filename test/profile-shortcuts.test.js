import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('profile league-night shortcuts', () => {
  const src = readFileSync(new URL('../src/profilePage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/lineup"/);
  assert.match(src, /href="\/trades"/);
  assert.match(src, /href="\/notifications"/);
  assert.match(src, /href="\/playoffs"/);
});
