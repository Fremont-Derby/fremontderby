import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

test('admin players search splits on whitespace without relying on \\s in a template literal', () => {
  const source = readFileSync(new URL('../src/adminPlayersPage.js', import.meta.url), 'utf8');
  assert.match(source, /split\(new RegExp\('/);
  assert.doesNotMatch(source, /split\(\/\s\+\//);
  // Evaluate the embedded search the way the browser receives it: template output must not become /s+/
  const html = renderAdminPlayersPage();
  assert.doesNotMatch(html, /split\(\/s\+\/\)/);
  assert.match(html, /split\(new RegExp\('/);
  assert.match(html, /No players match/);
});

test('admin players Find submit reports zero matches in status text', () => {
  const html = renderAdminPlayersPage();
  assert.match(html, /No players match/);
  assert.match(html, /setStatus\('No players match/);
});
