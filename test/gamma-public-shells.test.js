import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderFreeAgentsPage, renderPracticePage } from '../src/publicShellPages.js';

test('free-agents shell is honest and does not invent players', () => {
  const html = renderFreeAgentsPage();
  assert.match(html, /Free agents/);
  assert.match(html, /does not invent names/);
  assert.match(html, /href="\/teams"/);
  assert.doesNotMatch(html, /Kid League|druAgentSession|BETA_AUTH_BYPASS/);
});

test('practice shell is honest and points at schedule', () => {
  const html = renderPracticePage();
  assert.match(html, /Practice/);
  assert.match(html, /Nothing is scheduled/);
  assert.match(html, /href="\/schedule"/);
});

test('Gamma router serves the public shells before the legacy 404 path', async () => {
  const source = await readFile(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(source, /renderFreeAgentsPage/);
  assert.match(source, /renderPracticePage/);
  assert.match(source, /\/free-agents/);
  assert.match(source, /\/practice/);
});
