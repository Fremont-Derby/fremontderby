import assert from 'node:assert/strict';
import test from 'node:test';
import { updateTeamPracticeCommand } from '../src/teamCommands.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { readFileSync } from 'node:fs';

test('updateTeamPracticeCommand requires captain context fields and trims text', async () => {
  const calls = [];
  const repository = {
    async updateTeamPractice(payload) {
      calls.push(payload);
      return {
        teamId: payload.teamId,
        teamName: 'Breakers',
        practiceLocation: payload.practiceLocation,
        practiceSchedule: payload.practiceSchedule,
      };
    },
  };

  const result = await updateTeamPracticeCommand(
    {
      actorUserId: 'user-1',
      teamId: 'team-1',
      practiceLocation: '  Fremont Bowl  ',
      practiceSchedule: '  Thu 7pm  ',
    },
    repository,
  );

  assert.deepEqual(calls[0], {
    actorUserId: 'user-1',
    teamId: 'team-1',
    practiceLocation: 'Fremont Bowl',
    practiceSchedule: 'Thu 7pm',
  });
  assert.equal(result.practiceLocation, 'Fremont Bowl');
});

test('updateTeamPracticeCommand rejects overlong practice fields', async () => {
  await assert.rejects(
    () => updateTeamPracticeCommand(
      {
        actorUserId: 'user-1',
        teamId: 'team-1',
        practiceLocation: 'x'.repeat(121),
      },
      { async updateTeamPractice() { return {}; } },
    ),
    /120 characters/,
  );
});

test('teams page exposes captain practice editor and API path', () => {
  const html = renderTeamsPage();
  assert.match(html, /Team practice/);
  assert.match(html, /data-practice-location/);
  assert.match(html, /data-practice-schedule/);
  assert.match(html, /savePractice/);
  assert.match(html, /\/api\/teams\/.*\/practice/);
});

test('migration defines set_team_practice for active captains only', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260814140000_team_practice.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /set_team_practice/);
  assert.match(sql, /Only the active team captain can set practice details/);
  assert.match(sql, /practice_location/);
  assert.match(sql, /practice_schedule/);
});
