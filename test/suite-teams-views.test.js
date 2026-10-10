import test from 'node:test';
import assert from 'node:assert/strict';
import { listOwnTeamManagementCommand } from '../src/teamCommands.js';
import { listTeamStandingsCommand } from '../src/standingsCommands.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderSchedulePage } from '../src/schedulePage.js';

function management(teams) {
  return { async listOwnTeamManagement() { return { teams }; } };
}
function standings(teams) {
  return { async listTeamStandings(input) { return { ...input, teams }; } };
}

const views = [
  ['public', []],
  ['teammate', [{ teamId: 't1', role: 'member' }]],
  ['captain', [{ teamId: 't1', role: 'captain' }]],
  ['outsider', []],
  ['two teams', [{ teamId: 't1' }, { teamId: 't2' }]],
];
for (const [label, teams] of views) {
  test(label + ' sees ' + teams.length + ' managed teams', async () => {
    const result = await listOwnTeamManagementCommand({ actorUserId: label }, management(teams));
    assert.equal(result.teams.length, teams.length);
  });
  test(label + ' standings list has ' + teams.length + ' teams', async () => {
    const result = await listTeamStandingsCommand({ seasonId: 's1' }, standings(teams));
    assert.equal(result.teams.length, teams.length);
  });
}

for (const marker of ['data-match-list', 'data-round-panel', 'data-round-title', 'data-status']) {
  test('schedule keeps ' + marker + ' for every viewer', () => {
    assert.ok(renderSchedulePage().includes(marker));
  });
}
for (const marker of ['data-player-cards', 'data-panel', 'data-page-state', 'data-form']) {
  test('standings keeps ' + marker, () => {
    assert.ok(renderStandingsPage().includes(marker));
  });
}
test('teams page is a page', () => {
  assert.match(renderTeamsPage(), /<[a-z!]/i);
});
