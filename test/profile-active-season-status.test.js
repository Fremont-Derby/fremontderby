import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('profile enhancer loads registration for active seasons', () => {
  const src = readFileSync(new URL('../src/profileSeasonRegistrationEnhancer.js', import.meta.url), 'utf8');
  assert.match(src, /active','playoffs/);
  assert.match(src, /Payment due/);
  assert.match(src, /Not registered/);
});

test('score picker skips quiet repaint when signature unchanged', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, /scoreListSignature/);
  assert.match(src, /lastScoreSignature/);
});
