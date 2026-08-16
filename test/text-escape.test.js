import test from 'node:test';
import assert from 'node:assert/strict';
import { safeJson, escapeHtml } from '../src/textEscape.js';

test('safeJson escapes angle brackets for script embeds', () => {
  assert.equal(safeJson({ a: '<script>' }), '{"a":"\\u003cscript>"}');
});

test('escapeHtml covers amp lt gt quotes', () => {
  assert.equal(escapeHtml(`a&b<c>"d"'e'`), 'a&amp;b&lt;c&gt;&quot;d&quot;&#39;e&#39;');
});
