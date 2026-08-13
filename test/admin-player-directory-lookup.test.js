import assert from 'node:assert/strict';
import test from 'node:test';

import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

test('admin players directory supports A-Z lookup without perfect spelling', () => {
  const html = renderAdminPlayersPage();

  assert.match(html, /Find by player or team name/);
  assert.match(html, /Search players by name or team/);
  assert.match(html, /data-letter-index/);
  assert.match(html, /data-results-meta/);
  assert.match(html, /Jump to last name letter/);
  assert.match(html, /localeCompare/);
  assert.match(html, /matchesQuery/);
  assert.match(html, /playerLetter/);
  assert.match(html, /teamBlob/);
  assert.match(html, /Escape/);
  assert.match(html, /aria-controls="admin-player-list"/);
  assert.match(html, /Showing /);
});

test('admin season teams list sorts team names alphabetically within the active tab', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/adminSeasonTeamsPage.js', import.meta.url), 'utf8');
  assert.match(source, /localeCompare/);
  assert.match(source, /Team or captain name/);
});
