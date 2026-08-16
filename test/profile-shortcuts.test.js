import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('profile league-night shortcuts', () => {
  const src = readFileSync(new URL('../src/profilePage.js', import.meta.url), 'utf8');
  const i = src.indexOf('profile-shortcuts');
  const chunk = src.slice(i, i + 2000);
  for (const href of ['/scorecard', '/lineup', '/trades', '/playoffs', '/notifications']) {
    assert.match(chunk, new RegExp(href.replace('/', '\\/')));
  }
});
