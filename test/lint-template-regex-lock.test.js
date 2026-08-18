import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/lint-template-regex.mjs', import.meta.url), 'utf8');

test('lint-template-regex targets errorPopupScript in appShell', () => {
  assert.ok(source.includes('errorPopupScript'));
  assert.ok(source.includes('appShell.js'));
});

test('lint-template-regex keeps the \\s footgun pattern check', () => {
  // Actual source contains: /replace\(\/\\\\s\+\//
  assert.ok(source.includes('replace\\(\\/'));
  assert.ok(source.includes('browser gets'));
  assert.ok(source.includes('errorPopupScript must use'));
});
