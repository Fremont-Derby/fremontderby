import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IGNORED_DIRECTORY_NAMES,
  CHECKED_EXTENSIONS,
  lintText,
  shouldCheckFile,
  shouldIgnoreDirectory,
  lintTree,
} from '../scripts/lint.mjs';

test('lintText flags trailing whitespace, tabs, and missing final newline', () => {
  assert.deepEqual(lintText('a.js', 'ok\n'), []);
  assert.deepEqual(lintText('a.js', 'x \n'), ['a.js:1 trailing whitespace']);
  assert.deepEqual(lintText('a.js', '\tx\n'), ['a.js:1 tab character']);
  assert.deepEqual(lintText('a.js', 'no-newline'), ['a.js: missing final newline']);
  assert.deepEqual(lintText('a.js', ''), []);
});

test('lintText reports multiple problems on the same line and across lines', () => {
  const errors = lintText('b.js', '\ttrailing \nsecond\t\nno-nl');
  assert.ok(errors.includes('b.js:1 tab character'));
  assert.ok(errors.includes('b.js:1 trailing whitespace'));
  assert.ok(errors.includes('b.js:2 tab character'));
  assert.ok(errors.includes('b.js: missing final newline'));
});

test('extension allowlist and directory ignore list are locked', () => {
  assert.ok(CHECKED_EXTENSIONS.has('.js'));
  assert.ok(CHECKED_EXTENSIONS.has('.mjs'));
  assert.ok(CHECKED_EXTENSIONS.has('.md'));
  assert.ok(CHECKED_EXTENSIONS.has('.json'));
  assert.ok(CHECKED_EXTENSIONS.has('.jsonc'));
  assert.ok(CHECKED_EXTENSIONS.has('.yml'));
  assert.ok(CHECKED_EXTENSIONS.has('.yaml'));
  assert.equal(shouldCheckFile('x.js'), true);
  assert.equal(shouldCheckFile('x.ts'), false);
  assert.equal(shouldCheckFile('x.png'), false);

  assert.ok(IGNORED_DIRECTORY_NAMES.includes('node_modules'));
  assert.ok(IGNORED_DIRECTORY_NAMES.includes('.git'));
  assert.ok(IGNORED_DIRECTORY_NAMES.includes('dist'));
  assert.equal(shouldIgnoreDirectory('node_modules'), true);
  assert.equal(shouldIgnoreDirectory('src'), false);
});

test('lintTree walks files, skips ignored dirs and non-checked extensions', () => {
  const tree = {
    '/root': [
      { name: 'node_modules', isDirectory: () => true, isFile: () => false },
      { name: 'ok.js', isDirectory: () => false, isFile: () => true },
      { name: 'bad.js', isDirectory: () => false, isFile: () => true },
      { name: 'skip.png', isDirectory: () => false, isFile: () => true },
      { name: 'src', isDirectory: () => true, isFile: () => false },
    ],
    '/root/node_modules': [
      { name: 'evil.js', isDirectory: () => false, isFile: () => true },
    ],
    '/root/src': [
      { name: 'nested.js', isDirectory: () => false, isFile: () => true },
    ],
  };
  const files = {
    '/root/ok.js': 'fine\n',
    '/root/bad.js': 'trail \n',
    '/root/skip.png': 'ignored\t',
    '/root/node_modules/evil.js': 'tabs\there\n',
    '/root/src/nested.js': 'ok\n',
  };

  const errors = lintTree('/root', {
    readdirSync: (dir) => tree[dir] || [],
    readFileSync: (p) => files[p],
  });

  assert.deepEqual(errors, ['bad.js:1 trailing whitespace']);
});
