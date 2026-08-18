import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/lint-template-regex.mjs', import.meta.url), 'utf8');

test('lint-template-regex targets errorPopupScript in appShell', () => {
  assert.ok(source.includes('errorPopupScript'));
  assert.ok(source.includes('appShell.js'));
});

test('lint-template-regex requires double-escaped whitespace class in source', () => {
  // Script must look for \\s inside the template so the browser receives \s
  assert.ok(source.includes('\\\\s'));
  assert.ok(source.includes('replace('));
});
