import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('gamma prizes enhancer injects next match without dropping season helper', () => {
  const src = readFileSync(new URL('../src/publicSeasonSelectionEnhancer.js', import.meta.url), 'utf8');
  assert.match(src, /enhancePublicSeasonSelection/);
});
