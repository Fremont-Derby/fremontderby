import assert from 'node:assert/strict';
import test from 'node:test';
import { repairAdminPlayersScript } from '../src/adminPlayersScriptRepair.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';
import worker from '../src/routerEntry.js';

test('Gamma admin players repair shortens the search placeholder', () => {
  const sample =
    'placeholder="Type part of a name — e.g. “jen” or “breakers”"';
  assert.match(
    repairAdminPlayersScript(sample),
    /placeholder="Search by player or team"/,
  );
});

test('Gamma admin players route HTML gets the short search placeholder', async () => {
  const page = renderAdminPlayersPage();
  assert.match(page, /placeholder="Type part of a name/);
  const response = await worker.fetch(
    new Request('https://gamma.fremontderby.test/admin/players'),
    { ENVIRONMENT: 'gamma' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /placeholder="Search by player or team"/);
  assert.doesNotMatch(html, /placeholder="Type part of a name/);
});
