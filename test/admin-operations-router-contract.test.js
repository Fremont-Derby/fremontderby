import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const router = fs.readFileSync('src/router.js', 'utf8');
const shell = fs.readFileSync('src/appShell.js', 'utf8');
const packageJson = fs.readFileSync('package.json', 'utf8');

test('Worker routes the admin operations page and authenticated endpoint', () => {
  assert.match(router, /url\.pathname === '\/admin\/operations'/);
  assert.match(router, /url\.pathname === '\/api\/admin\/operations'/);
  assert.match(router, /adminOperationsHttpHandlers\.overview/);
  assert.match(router, /renderAdminOperationsPage/);
  assert.match(shell, /'\/admin\/operations'/);
});

test('syntax check includes every admin operations module', () => {
  for (const file of [
    'src/adminOperationsHttp.js',
    'src/adminOperationsPage.js',
    'src/adminOperationsRepository.js',
  ]) {
    assert.match(packageJson, new RegExp(`node --check ${file.replaceAll('.', '\\.')}`));
  }
});
