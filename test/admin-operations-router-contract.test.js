import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const router = fs.readFileSync('src/router.js', 'utf8');
const packageJson = fs.readFileSync('package.json', 'utf8');
const syntaxChecker = fs.readFileSync('scripts/check-js-syntax.mjs', 'utf8');

test('Worker routes the admin operations page and authenticated endpoint', () => {
  assert.match(router, /url\.pathname === '\/admin\/operations'/);
  assert.match(router, /url\.pathname === '\/api\/admin\/operations'/);
  assert.match(router, /adminOperationsHttpHandlers\.overview/);
  assert.match(router, /renderAdminOperationsPage/);
});

test('syntax check discovers admin operations modules through the src source tree', () => {
  assert.match(packageJson, /"check": "node scripts\/check-js-syntax\.mjs"/);
  assert.match(syntaxChecker, /DEFAULT_ROOTS = \['src', 'domain', 'scripts'\]/);
  assert.match(syntaxChecker, /INCLUDED_EXTENSIONS = new Set\(\['\.js', '\.mjs'\]\)/);
});
