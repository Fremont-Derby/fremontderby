import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ROOTS,
  EXCLUDED_DIRECTORIES,
  INCLUDED_EXTENSIONS,
  discoverJavaScriptFiles,
  checkJavaScriptSyntax,
  runCheckJsSyntax,
} from '../scripts/check-js-syntax.mjs';

test('syntax gate roots, extensions, and excludes are locked', () => {
  assert.deepEqual([...DEFAULT_ROOTS], ['src', 'domain', 'scripts']);
  for (const name of ['.git', 'dist', 'node_modules', 'coverage', '.wrangler']) {
    assert.ok(EXCLUDED_DIRECTORIES.has(name), name);
  }
  assert.ok(INCLUDED_EXTENSIONS.has('.js'));
  assert.ok(INCLUDED_EXTENSIONS.has('.mjs'));
  assert.equal(INCLUDED_EXTENSIONS.has('.ts'), false);
  assert.equal(INCLUDED_EXTENSIONS.has('.json'), false);
});

test('discoverJavaScriptFiles walks roots, skips excludes, keeps only .js/.mjs', async () => {
  const tree = {
    '/repo/src': [
      { name: 'a.js', isDirectory: () => false, isFile: () => true },
      { name: 'skip.ts', isDirectory: () => false, isFile: () => true },
      { name: 'nested', isDirectory: () => true, isFile: () => false },
    ],
    '/repo/src/nested': [
      { name: 'b.mjs', isDirectory: () => false, isFile: () => true },
    ],
    '/repo/domain': [
      { name: 'c.js', isDirectory: () => false, isFile: () => true },
    ],
    '/repo/scripts': [
      { name: 'node_modules', isDirectory: () => true, isFile: () => false },
      { name: 'd.js', isDirectory: () => false, isFile: () => true },
    ],
    '/repo/scripts/node_modules': [
      { name: 'evil.js', isDirectory: () => false, isFile: () => true },
    ],
  };

  const files = await discoverJavaScriptFiles('/repo', DEFAULT_ROOTS, {
    readdirImpl: async (dir) => {
      if (!(dir in tree)) {
        const err = new Error('missing');
        err.code = 'ENOENT';
        throw err;
      }
      return tree[dir];
    },
  });

  assert.deepEqual(files, ['domain/c.js', 'scripts/d.js', 'src/a.js', 'src/nested/b.mjs']);
});

test('checkJavaScriptSyntax fails closed on first non-zero --check', () => {
  const calls = [];
  const result = checkJavaScriptSyntax('/repo', ['src/a.js', 'src/b.js'], {
    spawnImpl: (cmd, args) => {
      calls.push([cmd, ...args]);
      if (args[1] === 'src/b.js') return { status: 1, stdout: '', stderr: 'SyntaxError' };
      return { status: 0, stdout: '', stderr: '' };
    },
    execPath: '/node',
  });
  assert.equal(result.ok, false);
  assert.equal(result.file, 'src/b.js');
  assert.match(result.output, /SyntaxError/);
  assert.equal(calls.length, 2);
});

test('runCheckJsSyntax composes discovery + check', async () => {
  const result = await runCheckJsSyntax({
    cwd: '/repo',
    roots: ['src'],
    readdirImpl: async () => [{ name: 'ok.js', isDirectory: () => false, isFile: () => true }],
    spawnImpl: () => ({ status: 0, stdout: '', stderr: '' }),
    execPath: '/node',
  });
  assert.deepEqual(result, { ok: true, checked: 1 });
});
