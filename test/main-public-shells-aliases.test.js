import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderFreeAgentsPage, renderPracticePage } from '../src/publicShellPages.js';
import { PUBLIC_PATH_ALIASES, aliasRedirect } from '../src/publicPathAliases.js';

// Tracks #2236. Out of scope: Gamma wrangler, DRU bypass, kid seed, #2224 snapshot hygiene.

test('free-agents shell is honest and does not invent players', () => {
  const html = renderFreeAgentsPage();
  assert.match(html, /Free agents/);
  assert.match(html, /does not invent names/);
});

test('practice shell is honest', () => {
  const html = renderPracticePage();
  assert.match(html, /Practice/);
  assert.match(html, /Nothing is scheduled/);
});

test('aliases and trailing slashes 302 to product pages', () => {
  assert.equal(PUBLIC_PATH_ALIASES['/login'], '/profile');
  const login = aliasRedirect(new Request('https://fremontderby.com/login'), new URL('https://fremontderby.com/login'));
  assert.equal(login.status, 302);
  assert.equal(login.headers.get('location'), 'https://fremontderby.com/profile');
  const slash = aliasRedirect(new Request('https://fremontderby.com/teams/'), new URL('https://fremontderby.com/teams/'));
  assert.equal(slash.status, 302);
  assert.equal(slash.headers.get('location'), 'https://fremontderby.com/teams');
});

test('production router keeps health stamping and wires the new surfaces', async () => {
  const source = await readFile(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(source, /STAMPED_DEPLOY_GIT_SHA/);
  assert.match(source, /aliasRedirect/);
  assert.match(source, /renderFreeAgentsPage/);
  assert.match(source, /renderPracticePage/);
});
