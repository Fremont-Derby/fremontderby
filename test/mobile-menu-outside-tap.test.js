import test from 'node:test';
import assert from 'node:assert/strict';
import { mobileMenuScript, mobileMenuStyles } from '../src/mobileMenuAccessibility.js';

test('open menu keeps the bottom dock visible and dismisses outside taps', () => {
  assert.match(mobileMenuStyles, /fd-mobile-dock \{\s*opacity: 1;/);
  assert.doesNotMatch(mobileMenuStyles, /opacity: \.2/);
  assert.match(mobileMenuStyles, /pointer-events: none/);
  assert.match(mobileMenuScript, /pointerdown/);
  assert.match(mobileMenuScript, /menu\.contains\(event\.target\)/);
  assert.match(mobileMenuScript, /menu\.open = false/);
});
