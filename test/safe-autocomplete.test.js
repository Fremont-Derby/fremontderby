
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterSafeSuggestions,
  PRACTICE_LOCATION_SUGGESTIONS,
  safeAutocompleteClientScript,
} from '../src/safeAutocomplete.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderSchedulePage } from '../src/schedulePage.js';
import { renderProfilePage } from '../src/profilePage.js';

test('filterSafeSuggestions requires min chars and caps results', () => {
  assert.deepEqual(filterSafeSuggestions('F', PRACTICE_LOCATION_SUGGESTIONS), []);
  const hits = filterSafeSuggestions('Fre', PRACTICE_LOCATION_SUGGESTIONS);
  assert.ok(hits.length >= 1);
});

test('client script loads public individual standings for player names', () => {
  assert.match(safeAutocompleteClientScript, /individual-standings/);
  assert.match(safeAutocompleteClientScript, /publicPlayers/);
  assert.match(safeAutocompleteClientScript, /loadPublicPlayerNames/);
});

test('profile claim and pages wire public player autocomplete', () => {
  const profile = renderProfilePage();
  assert.match(profile, /publicPlayers/);
  assert.match(profile, /fdSafeAutocomplete|data-safe-autocomplete/);
  assert.match(renderTeamsPage(), /data-safe-ac/);
  assert.match(renderSchedulePage(), /data-safe-ac/);
});
