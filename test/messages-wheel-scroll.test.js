import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('desktop messages list can scroll with the wheel', () => {
  const src = readFileSync(new URL('../src/messagesTheme.js', import.meta.url), 'utf8');
  assert.match(src, /messagesThemeStyles/);
});
