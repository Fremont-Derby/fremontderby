import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PUBLIC_HTML_PATHS, PUBLIC_JSON_PATHS } from '../scripts/public-surface-contract.mjs';
import { htmlShellOk } from '../scripts/assert-public-surface.mjs';

test('htmlShellOk requires doctype + brand marker', () => {
  assert.equal(htmlShellOk('<!doctype html><meta name="viewport" content="width=device-width"><title>Fremont Derby</title>'), true);
  assert.equal(htmlShellOk('<html>nope</html>'), false);
});

test('critical public paths still appear in worker entry sources', () => {
  const blob = ['src/index.js', 'src/routerEntry.js', 'src/appShell.js', 'src/pathAliases.js', 'src/publicPages.js']
    .map((p) => readFileSync(p, 'utf8'))
    .join('\n');
  for (const path of [...PUBLIC_HTML_PATHS, ...PUBLIC_JSON_PATHS]) {
    if (path === '/') continue; // too generic
    assert.ok(
      blob.includes(`"${path}"`) || blob.includes(`'${path}'`) || blob.includes(path),
      `missing route reference for ${path}`,
    );
  }
});
