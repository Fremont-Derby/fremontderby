import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/lint-template-regex.mjs', import.meta.url), 'utf8');

test('lint-template-regex targets errorPopupScript in appShell', () => {
  assert.match(source, /errorPopupScript/);
  assert.match(source, /appShell\.js/);
});

test('lint-template-regex requires double-escaped \\s in source', () => {
  assert.match(source, /replace\(\/\\\\s\\\+\//);
});
