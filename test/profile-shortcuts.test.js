import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('profile league-night shortcuts', () => {
  const src = readFileSync(new URL('../src/profilePage.js', import.meta.url), 'utf8');
  assert.match(src, /renderProfilePage/);
  assert.match(src, /href="\/admin\/players"/);
  assert.match(src, /href="\/admin\/operations"/);
  assert.match(src, /href="\/season-setup"/);
});
