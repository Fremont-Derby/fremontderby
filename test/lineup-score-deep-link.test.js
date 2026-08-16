import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('lineup scoreHref is dynamic with match query', () => {
  const src = readFileSync(new URL('../src/lineupPage.js', import.meta.url), 'utf8');
  assert.match(src, /scoreHref:\(\)=>\{/);
  assert.match(src, /qs\.set\('match'/);
});

test('blind lineup resolves scoreHref function', () => {
  const src = readFileSync(new URL('../src/blindLineupComponent.js', import.meta.url), 'utf8');
  assert.match(src, /typeof adapter\.scoreHref==='function'/);
});
