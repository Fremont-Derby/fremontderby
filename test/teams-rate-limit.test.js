import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('teams tells the user to wait when the lane is rate limited', () => {
  const html = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(html, /Too many requests\. Wait a few seconds and try again/);
});
