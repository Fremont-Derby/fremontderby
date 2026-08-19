import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  DEFAULT_ROOTS,
  EXCLUDED_DIRECTORIES,
  INCLUDED_EXTENSIONS,
  discoverJavaScriptFiles,
  checkJavaScriptSyntax,
} from '../scripts/check-js-syntax.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('syntax check roots cover src, domain, and scripts only', () => {
  assert.deepEqual([...DEFAULT_ROOTS], ['src', 'domain', 'scripts']);
  assert.ok(EXCLUDED_DIRECTORIES.has('node_modules'));
  assert.ok(EXCLUDED_DIRECTORIES.has('.wrangler'));
  assert.ok(INCLUDED_EXTENSIONS.has('.js'));
  assert.ok(INCLUDED_EXTENSIONS.has('.mjs'));
  assert.ok(!INCLUDED_EXTENSIONS.has('.json'));
});

test('discoverJavaScriptFiles finds routerEntry and excludes node_modules', async () => {
  const files = await discoverJavaScriptFiles(root);
  assert.ok(files.some((f) => f.replace(/\\/g, '/').endsWith('src/routerEntry.js')));
  assert.ok(files.some((f) => f.replace(/\\/g, '/').includes('scripts/')));
  assert.ok(!files.some((f) => f.includes('node_modules')));
  assert.ok(files.length > 20);
});

test('checkJavaScriptSyntax passes for a known-good file', () => {
  const target = 'src/stripTrailingSlashes.js';
  assert.ok(existsSync(join(root, target)));
  const result = checkJavaScriptSyntax(root, [target]);
  assert.equal(result.ok, true);
  assert.equal(result.checked, 1);
});
