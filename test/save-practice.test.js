import assert from 'node:assert/strict';
import test from 'node:test';
import { updateTeamPracticeCommand } from '../src/teamCommands.js';
import { readFileSync } from 'node:fs';

test('updateTeamPracticeCommand defaults blank recurrence to weekly when details present', async () => {
  let saved = null;
  const practice = await updateTeamPracticeCommand(
    {
      actorUserId: 'user-1',
      teamId: 'team-1',
      practiceLocation: 'Fremont Bowl',
      practiceSchedule: '6:30 PM',
      practiceRecurrence: '',
      practiceOn: null,
    },
    {
      async updateTeamPractice(payload) {
        saved = payload;
        return { teamId: 'team-1', teamName: 'Sharks', ...payload };
      },
    },
  );
  assert.equal(saved.practiceRecurrence, 'weekly');
  assert.equal(practice.practiceLocation, 'Fremont Bowl');
});

test('teams page savePractice resolves team_id aliases', () => {
  const src = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(src, /team\.teamId\|\|team\.team_id\|\|team\.id/);
  assert.match(src, /practiceRecurrence='weekly'/);
});
