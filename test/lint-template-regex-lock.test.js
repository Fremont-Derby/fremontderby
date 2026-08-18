import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/lint-template-regex.mjs', import.meta.url), 'utf8');

test('lint-template-regex targets errorPopupScript in appShell', () => {
  assert.ok(source.includes('errorPopupScript'));
  assert.ok(source.includes('appShell.js'));
});

test('lint-template-regex requires double-escaped whitespace class in source', () => {
  // Source must contain the pattern that checks for \\s inside templates
  assert.ok(source.includes('replace(\\/'));
  assert.ok(source.includes('browser gets'));
  assert.ok(source.includes('errorPopupScript must use'));
});
