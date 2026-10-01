import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('admin players page shows explicit empty-search feedback', () => {
  const src = readFileSync(new URL('../src/adminPlayersPage.js', import.meta.url), 'utf8');
  assert.match(src, /data-search/);
  assert.match(src, /data-empty/);
  assert.match(src, /No players match/);
});

test('admin seasons page shows explicit empty-search feedback', () => {
  const src = readFileSync(new URL('../src/adminSeasonsPage.js', import.meta.url), 'utf8');
  assert.match(src, /data-search/);
  assert.match(src, /data-empty/);
  assert.match(src, /No seasons match/);
});

test('admin season teams page shows explicit empty-search feedback', () => {
  const src = readFileSync(new URL('../src/adminSeasonTeamsPage.js', import.meta.url), 'utf8');
  assert.match(src, /data-search/);
  assert.match(src, /No teams match/);
  assert.match(src, /setState\(empty\.textContent,\s*'error'\)/);
});

test('admin operations overview is not a silent typeahead directory', () => {
  const src = readFileSync(new URL('../src/adminOperationsPage.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /data-search/);
});
