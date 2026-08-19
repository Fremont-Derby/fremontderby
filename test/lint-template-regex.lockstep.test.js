import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ERROR_POPUP_SCRIPT_MARKER,
  ESCAPED_WHITESPACE_CLASS_RE,
  validateErrorPopupScriptEscape,
  lintTemplateRegexFromFile,
} from '../scripts/lint-template-regex.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('real appShell.js satisfies the escaped whitespace-class footgun guard', () => {
  const src = readFileSync(join(root, 'src/appShell.js'), 'utf8');
  assert.ok(src.includes(ERROR_POPUP_SCRIPT_MARKER));
  const result = validateErrorPopupScriptEscape(src);
  assert.equal(result.ok, true);
});

test('validateErrorPopupScriptEscape fails when marker is missing', () => {
  const result = validateErrorPopupScriptEscape('const other = 1;');
  assert.equal(result.ok, false);
  assert.match(result.error, /errorPopupScript not found/);
});

test('validateErrorPopupScriptEscape fails on unescaped /\\s+/ inside the template chunk', () => {
  // Simulates source that would emit /s+/ (dotAll) instead of whitespace class.
  const bad = [
    'const errorPopupScript = `',
    '  value.replace(/\\s+/g, "");',
    '`;',
  ].join('\n');
  const result = validateErrorPopupScriptEscape(bad);
  assert.equal(result.ok, false);
  assert.match(result.error, /must use/);
});

test('validateErrorPopupScriptEscape passes when source has \\\\s for browser \\s', () => {
  const good = [
    'const errorPopupScript = `',
    '  value.replace(/\\\\s+/g, "");',
    '`;',
  ].join('\n');
  assert.equal(validateErrorPopupScriptEscape(good).ok, true);
  assert.equal(ESCAPED_WHITESPACE_CLASS_RE.test(good), true);
});

test('lintTemplateRegexFromFile uses injectable readFileSync', () => {
  const good = 'const errorPopupScript = `x.replace(/\\\\s+/g,"")`;';
  const result = lintTemplateRegexFromFile('virtual://appShell.js', {
    readFileSync: () => good,
  });
  assert.equal(result.ok, true);
});
