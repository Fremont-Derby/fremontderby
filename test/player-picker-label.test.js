import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatPlayerPickerLabel,
  markDuplicateNames,
} from '../src/playerPickerLabel.js';
import { renderTeamsPage } from '../src/teamsPage.js';

test('duplicate names get extra disambiguation in labels', () => {
  const players = markDuplicateNames([
    { playerId: '11111111-1111-1111-1111-111111111101', displayName: 'Jane Smith', hasLogin: true, createdAt: '2024-03-01' },
    { playerId: '11111111-1111-1111-1111-111111111102', displayName: 'Jane Smith', hasLogin: false, createdAt: '2025-01-01' },
    { playerId: '11111111-1111-1111-1111-111111111103', displayName: 'Bob Lee', hasLogin: true },
  ]);
  assert.equal(players[0].isDuplicateName, true);
  assert.equal(players[2].isDuplicateName, false);
  const a = formatPlayerPickerLabel(players[0]);
  const b = formatPlayerPickerLabel(players[1]);
  assert.match(a, /Jane Smith/);
  assert.match(a, /Account linked/);
  assert.match(a, /#1101/);
  assert.match(b, /Unclaimed/);
  assert.match(b, /#1102/);
  assert.notEqual(a, b);
});

test('teams page builds disambiguated invite options', () => {
  const html = renderTeamsPage();
  assert.match(html, /function playerOptionLabel/);
  assert.match(html, /fillPlayerSelect/);
  assert.match(html, /function renderCaptainTeams/);
  assert.match(html, /Choose a player/);
  assert.match(html, /data-invite-player-select/);
});
