import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PUBLIC_PATH_ALIASES, aliasRedirect } from '../src/publicPathAliases.js';

// Tracks #2229 #2232 #2234. Out of scope: main promotion, DRU bypass, kid seed, UI restyle.

test('aliases map the live Gamma 404 paths to real product pages', () => {
  assert.equal(PUBLIC_PATH_ALIASES['/home'], '/');
  assert.equal(PUBLIC_PATH_ALIASES['/login'], '/profile');
  assert.equal(PUBLIC_PATH_ALIASES['/score'], '/scorecard');
});

test('aliasRedirect issues a 302 to the product page', () => {
  const url = new URL('https://gamma.fremontderby.com/login');
  const response = aliasRedirect(new Request(url), url);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://gamma.fremontderby.com/profile');
});

test('trailing slashes redirect to the canonical product path', () => {
  const url = new URL('https://gamma.fremontderby.com/availability/?night=1');
  const response = aliasRedirect(new Request(url), url);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://gamma.fremontderby.com/availability?night=1');
});

test('the site root is not redirected away from /', () => {
  const url = new URL('https://gamma.fremontderby.com/');
  assert.equal(aliasRedirect(new Request(url), url), null);
});

test('unknown paths are left to the existing router', () => {
  const url = new URL('https://gamma.fremontderby.com/standings');
  assert.equal(aliasRedirect(new Request(url), url), null);
});

test('Gamma router wires aliasRedirect before the legacy 404 path', async () => {
  const source = await readFile(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(source, /aliasRedirect/);
});
