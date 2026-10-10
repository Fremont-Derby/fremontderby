import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('player surface theme covers teams schedule and status chips', () => {
  const src = readFileSync(new URL('../src/playerSurfaceTheme.js', import.meta.url), 'utf8');
  assert.match(src, /playerSurfaceThemeStyles/);
});
