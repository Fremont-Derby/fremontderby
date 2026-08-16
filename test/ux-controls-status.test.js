import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const design = readFileSync(new URL('../src/designSystem.js', import.meta.url), 'utf8');
const player = readFileSync(new URL('../src/playerSurfaceTheme.js', import.meta.url), 'utf8');
const docs = readFileSync(new URL('../docs/ux-controls-and-status.md', import.meta.url), 'utf8');

test('design tokens separate control radius from pills', () => {
  assert.match(design, /--fd-radius-control:\s*10px/);
  assert.match(design, /--fd-touch-min:\s*44px/);
  assert.match(design, /--fd-pill-success-text/);
});

test('selects are rectangular controls with touch-friendly sizing', () => {
  assert.match(design, /border-radius:\s*var\(--fd-radius-control\)/);
  assert.match(design, /font-size:\s*16px/);
  assert.match(design, /appearance:\s*none/);
  assert.match(player, /border-radius:\s*var\(--fd-radius-control\)/);
});

test('hub-team is not a pill; status-pill remains pill', () => {
  assert.match(design, /\.hub-team\s*\{[^}]*fd-radius-control/s);
  assert.match(design, /\.status-pill/);
  assert.match(design, /--fd-radius-pill/);
});

test('docs describe control vs status language', () => {
  assert.match(docs, /Rectangles = controls/);
  assert.match(docs, /Pills = short status/);
  assert.match(docs, /44px/);
});
