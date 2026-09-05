import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PUBLIC_PATH_ALIASES, aliasRedirect } from '../src/publicPathAliases.js';

test('aliases map the live Gamma 404 paths to real product pages', () => {
  assert.equal(PUBLIC_PATH_ALIASES['/home'], '/');
  assert.equal(PUBLIC_PATH_ALIASES['/register'], '/profile');
  assert.equal(PUBLIC_PATH_ALIASES['/tonight'], '/availability');
  assert.equal(PUBLIC_PATH_ALIASES['/check-in'], '/availability');
  assert.equal(PUBLIC_PATH_ALIASES['/checkin'], '/availability');
  assert.equal(PUBLIC_PATH_ALIASES['/ready'], '/availability');
});

test('aliasRedirect issues a 302 to the product page', () => {
  const url = new URL('https://gamma.fremontderby.com/register');
  const response = aliasRedirect(new Request(url), url);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://gamma.fremontderby.com/profile');
});

test('unknown paths are left to the existing router', () => {
  const url = new URL('https://gamma.fremontderby.com/standings');
  assert.equal(aliasRedirect(new Request(url), url), null);
});

test('Gamma router wires aliasRedirect before the legacy 404 path', async () => {
  const source = await readFile(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(source, /aliasRedirect/);
});
