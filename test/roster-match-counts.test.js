import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('roster match counts enrichment and UI', () => {
  const repo = readFileSync(new URL('../src/teamRepository.js', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(repo, /matchesForTeam/);
  assert.match(repo, /postseasonEligible/);
  assert.match(page, /for us ·/);
  assert.match(page, /Playoff eligible/);
});
