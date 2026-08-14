import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterSafeSuggestions,
  PRACTICE_LOCATION_SUGGESTIONS,
  safeAutocompleteClientScript,
} from '../src/safeAutocomplete.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderSchedulePage } from '../src/schedulePage.js';

test('filterSafeSuggestions requires min chars and caps results', () => {
  assert.deepEqual(filterSafeSuggestions('F', PRACTICE_LOCATION_SUGGESTIONS), []);
  const hits = filterSafeSuggestions('Fre', PRACTICE_LOCATION_SUGGESTIONS);
  assert.ok(hits.length >= 1);
  assert.ok(hits.every((h) => h.toLowerCase().includes('fre')));
  const many = Array.from({ length: 50 }, (_, i) => `Alpha ${i}`);
  assert.equal(filterSafeSuggestions('Alpha', many).length, 8);
});

test('teams and schedule pages include safe autocomplete wiring', () => {
  const teams = renderTeamsPage();
  assert.match(teams, /data-safe-ac/);
  assert.match(teams, /fdSafeAutocomplete|data-safe-autocomplete/);
  const schedule = renderSchedulePage();
  assert.match(schedule, /makeupLocation|data-safe-ac/);
});

test('client script enforces min 2 chars', () => {
  assert.match(safeAutocompleteClientScript, /const MIN = 2/);
  assert.match(safeAutocompleteClientScript, /maxResults|MAX/);
});
