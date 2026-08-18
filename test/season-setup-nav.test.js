import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('season setup links score and audit', () => {
  const src = readFileSync(new URL('../src/seasonSetupPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/admin\/audit"/);
});

test('lineup gates prefer score hub secondary', () => {
  const src = readFileSync(new URL('../src/lineupPage.js', import.meta.url), 'utf8');
  assert.match(src, /secondaryHref:'\/scorecard'/);
});
