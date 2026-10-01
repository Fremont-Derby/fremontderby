import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const design = readFileSync(new URL('../src/designSystem.js', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../src/adminSurfaceTheme.js', import.meta.url), 'utf8');
const player = readFileSync(new URL('../src/playerSurfaceTheme.js', import.meta.url), 'utf8');
const docs = readFileSync(new URL('../docs/project-cohesion.md', import.meta.url), 'utf8');

test('status tone aliases are normalized in design system', () => {
  assert.match(design, /Status tone cohesion/);
  assert.match(design, /data-tone="healthy"/);
  assert.match(design, /data-tone="critical"/);
});

test('player and admin surfaces remap page-local agent tokens', () => {
  assert.match(player, /--line:\s*var\(--fd-border\)/);
  assert.match(admin, /--line:\s*var\(--fd-border\)/);
  assert.match(admin, /page-local agent themes/);
});

test('cohesion doc lists systems and tone map', () => {
  assert.match(docs, /Project cohesion/);
  assert.match(docs, /healthy/);
  assert.match(docs, /designSystem\.js/);
});
