import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const design = readFileSync(new URL('../src/designSystem.js', import.meta.url), 'utf8');
const player = readFileSync(new URL('../src/playerSurfaceTheme.js', import.meta.url), 'utf8');

test('professional polish layer is present', () => {
  assert.match(design, /Professional polish/);
  assert.match(design, /\.status:empty/);
  assert.match(design, /optimizeLegibility/);
  assert.match(player, /\.status:empty/);
});
