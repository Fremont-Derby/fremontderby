import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { discoverJavaScriptFiles } from '../scripts/check-js-syntax.mjs';

const checkerPath = fileURLToPath(new URL('../scripts/check-js-syntax.mjs', import.meta.url));

async function makeFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'fremontderby-syntax-'));
  for (const directory of ['src/nested', 'domain', 'scripts', 'src/node_modules/pkg', 'scripts/dist']) {
    await mkdir(path.join(root, directory), { recursive: true });
  }

  await writeFile(path.join(root, 'src/new-module.js'), 'export const value = 1;\n');
  await writeFile(path.join(root, 'src/nested/another.js'), 'export function ok() { return true; }\n');
  await writeFile(path.join(root, 'scripts/tool.mjs'), 'console.log("ok");\n');
  await writeFile(path.join(root, 'domain/bad.js'), 'export const broken = ;\n');
  await writeFile(path.join(root, 'src/node_modules/pkg/ignored.js'), 'export const broken = ;\n');
  await writeFile(path.join(root, 'scripts/dist/ignored.mjs'), 'export const broken = ;\n');
  return root;
}

test('syntax discovery automatically finds source modules and excludes generated/vendor directories', async () => {
  const root = await makeFixture();
  try {
    const files = await discoverJavaScriptFiles(root);
    assert.deepEqual(files, [
      path.join('domain', 'bad.js'),
      path.join('scripts', 'tool.mjs'),
      path.join('src', 'nested', 'another.js'),
      path.join('src', 'new-module.js'),
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('checker fails on an invalid discovered module, names it, then passes after correction', async () => {
  const root = await makeFixture();
  try {
    let result = spawnSync(process.execPath, [checkerPath], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Syntax check failed: domain[\\/]bad\.js/);

    await writeFile(path.join(root, 'domain/bad.js'), 'export const fixed = true;\n');
    result = spawnSync(process.execPath, [checkerPath], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Syntax checked 4 JavaScript modules\./);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
