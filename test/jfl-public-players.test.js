import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import routerEntry from '../src/routerEntry.js';

test('JFL router entry serves the public players directory', () => {
  const src = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(src, /renderPlayersDirectoryPage/);
  assert.match(src, /pathname === '\/players'/);
  const shell = readFileSync(new URL('../src/jflModernShell.js', import.meta.url), 'utf8');
  assert.match(shell, /href: '\/players'/);
  assert.match(shell, /key: 'players'/);
});

test('JFL worker serves /players as HTML 200', async () => {
  const response = await routerEntry.fetch(
    new Request('https://jfl.fremontderby.test/players'),
    { ENVIRONMENT: 'jfl' },
    {},
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /Player directory · Fremont Derby/);
  assert.match(html, /data-search/);
  assert.doesNotMatch(html, /This dog lost the rack/);
  assert.doesNotMatch(html, /tel:|data-phone|phoneNumber|phone_number/i);
});
