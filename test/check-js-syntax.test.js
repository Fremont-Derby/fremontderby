import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ROOTS,
  EXCLUDED_DIRECTORIES,
  INCLUDED_EXTENSIONS,
  checkJavaScriptSyntax,
  discoverJavaScriptFiles,
} from '../scripts/check-js-syntax.mjs';

test('syntax discover defaults cover src domain scripts', () => {
  assert.deepEqual(DEFAULT_ROOTS, ['src', 'domain', 'scripts']);
  assert.ok(EXCLUDED_DIRECTORIES.has('node_modules'));
  assert.ok(EXCLUDED_DIRECTORIES.has('.wrangler'));
  assert.ok(INCLUDED_EXTENSIONS.has('.js'));
  assert.ok(INCLUDED_EXTENSIONS.has('.mjs'));
});

test('discoverJavaScriptFiles returns empty for missing roots', async () => {
  const files = await discoverJavaScriptFiles(process.cwd(), ['does-not-exist-xyz']);
  assert.deepEqual(files, []);
});

test('checkJavaScriptSyntax reports first failing file', () => {
  const spawn = () => ({ status: 1, stdout: '', stderr: 'SyntaxError' });
  const result = checkJavaScriptSyntax('/tmp', ['bad.js'], spawn);
  assert.equal(result.ok, false);
  assert.equal(result.file, 'bad.js');
});

test('checkJavaScriptSyntax passes when all checks succeed', () => {
  const spawn = () => ({ status: 0, stdout: '', stderr: '' });
  const result = checkJavaScriptSyntax('/tmp', ['a.js', 'b.mjs'], spawn);
  assert.deepEqual(result, { ok: true, checked: 2 });
});
