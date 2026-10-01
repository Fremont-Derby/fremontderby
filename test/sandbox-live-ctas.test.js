import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('captain sandbox links live league night surfaces', () => {
  const src = readFileSync(new URL('../src/captainSandboxPage.js', import.meta.url), 'utf8');
  for (const href of ['/scorecard', '/lineup', '/availability', '/standings']) {
    assert.match(src, new RegExp(href.replace('/', '\\/')));
  }
});
