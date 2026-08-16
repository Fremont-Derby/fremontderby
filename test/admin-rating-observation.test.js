import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('admin rating observation path is wired', () => {
  const http = readFileSync(new URL('../src/adminPlayersHttp.js', import.meta.url), 'utf8');
  const repo = readFileSync(new URL('../src/adminPlayersRepository.js', import.meta.url), 'utf8');
  const entry = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../src/adminPlayersPage.js', import.meta.url), 'utf8');
  assert.match(http, /handleRecordRatingObservationRequest/);
  assert.match(repo, /record_rating_observation/);
  assert.match(entry, /rating-observation/);
  assert.match(page, /Save rating seed/);
  assert.match(page, /admin_provisional/);
  assert.match(page, /official_fargo/);
});
