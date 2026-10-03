import test from 'node:test';
import assert from 'node:assert/strict';
import { addedPlayerLine, captainTransferLine } from '../src/captainLines.js';
import { renderTeamsPage } from '../src/teamsPage.js';

test('a captain can name an added player and a captain transfer', () => {
  assert.equal(addedPlayerLine({ player: 'Ada', team: 'Owls' }), 'Ada was added to Owls.');
  assert.equal(captainTransferLine({ team: 'Owls', from: 'Ada', to: 'Bea' }), 'Captain of Owls moved from Ada to Bea.');
  const html = renderTeamsPage();
  assert.match(html, /Ada was added to Owls/);
  assert.match(html, /Captain of Owls moved from Ada to Bea/);
});
