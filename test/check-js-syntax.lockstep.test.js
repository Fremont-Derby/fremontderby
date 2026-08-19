import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ROOTS,
  EXCLUDED_DIRECTORIES,
  INCLUDED_EXTENSIONS,
  shouldExcludeDirectory,
  shouldIncludeFile,
  discoverJavaScriptFiles,
  checkJavaScriptSyntax,
} from '../scripts/check-js-syntax.mjs';

test('roots, exclusions, and extensions are locked', () => {
  assert.deepEqual([...DEFAULT_ROOTS], ['src', 'domain', 'scripts']);
  for (const name of ['.git', 'dist', 'node_modules', 'coverage', '.wrangler']) {
    assert.equal(shouldExcludeDirectory(name), true);
    assert.ok(EXCLUDED_DIRECTORIES.has(name));
  }
  assert.equal(shouldExcludeDirectory('src'), false);
  assert.equal(shouldIncludeFile('a.js'), true);
  assert.equal(shouldIncludeFile('a.mjs'), true);
  assert.equal(shouldIncludeFile('a.ts'), false);
  assert.equal(shouldIncludeFile('a.json'), false);
  assert.ok(INCLUDED_EXTENSIONS.has('.js'));
});

test('discoverJavaScriptFiles walks roots, skips excluded dirs, sorts paths', async () => {
  const tree = {
    '/repo/src': [
      { name: 'z.js', isDirectory: () => false, isFile: () => true },
      { name: 'a.js', isDirectory: () => false, isFile: () => true },
      { name: 'node_modules', isDirectory: () => true, isFile: () => false },
      { name: 'skip.ts', isDirectory: () => false, isFile: () => true },
    ],
    '/repo/src/node_modules': [
      { name: 'evil.js', isDirectory: () => false, isFile: () => true },
    ],
    '/repo/domain': [
      { name: 'core.mjs', isDirectory: () => false, isFile: () => true },
    ],
    '/repo/scripts': [
      { name: 'tool.js', isDirectory: () => false, isFile: () => true },
    ],
  };

  const files = await discoverJavaScriptFiles('/repo', ['src', 'domain', 'scripts'], {
    readdir: async (dir) => {
      if (!tree[dir]) {
        const err = new Error('ENOENT');
        err.code = 'ENOENT';
        throw err;
      }
      return tree[dir];
    },
  });

  assert.deepEqual(files, [
    'domain/core.mjs',
    'scripts/tool.js',
    'src/a.js',
    'src/z.js',
  ]);
});

test('checkJavaScriptSyntax stops on first non-zero --check', () => {
  const checked = [];
  const result = checkJavaScriptSyntax(
    '/repo',
    ['src/ok.js', 'src/bad.js', 'src/later.js'],
    {
      spawnSync: (_cmd, args) => {
        checked.push(args[1]);
        if (args[1] === 'src/bad.js') {
          return { status: 1, stdout: '', stderr: 'SyntaxError' };
        }
        return { status: 0, stdout: '', stderr: '' };
      },
      execPath: 'node',
    },
  );
  assert.equal(result.ok, false);
  assert.equal(result.file, 'src/bad.js');
  assert.match(result.output, /SyntaxError/);
  assert.deepEqual(checked, ['src/ok.js', 'src/bad.js']);
});

test('checkJavaScriptSyntax reports checked count when all pass', () => {
  const result = checkJavaScriptSyntax('/repo', ['a.js', 'b.js'], {
    spawnSync: () => ({ status: 0, stdout: '', stderr: '' }),
    execPath: 'node',
  });
  assert.deepEqual(result, { ok: true, checked: 2 });
});
