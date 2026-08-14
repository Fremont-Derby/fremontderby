import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatTeamPracticeAnnouncement,
  updateTeamPracticeCommand,
} from '../src/teamCommands.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { readFileSync } from 'node:fs';

test('updateTeamPracticeCommand saves weekly practice and notifies team chat', async () => {
  const calls = [];
  const chatCalls = [];
  const repository = {
    async updateTeamPractice(payload) {
      calls.push(payload);
      return {
        teamId: payload.teamId,
        teamName: 'Breakers',
        practiceLocation: payload.practiceLocation,
        practiceSchedule: payload.practiceSchedule,
        practiceRecurrence: payload.practiceRecurrence,
        practiceOn: payload.practiceOn,
      };
    },
  };
  const chatRepository = {
    async sendTeamMessage(payload) {
      chatCalls.push(payload);
      return { id: 'msg-1' };
    },
  };

  const result = await updateTeamPracticeCommand(
    {
      actorUserId: 'user-1',
      teamId: 'team-1',
      practiceLocation: '  Fremont Bowl  ',
      practiceSchedule: '  7pm  ',
      practiceRecurrence: 'weekly',
    },
    repository,
    { chatRepository },
  );

  assert.equal(calls[0].practiceRecurrence, 'weekly');
  assert.equal(calls[0].practiceOn, null);
  assert.equal(result.practiceLocation, 'Fremont Bowl');
  assert.equal(chatCalls.length, 1);
  assert.match(chatCalls[0].body, /Weekly practice/);
  assert.match(chatCalls[0].body, /Fremont Bowl/);
});

test('one-off practice requires a date', async () => {
  await assert.rejects(
    () => updateTeamPracticeCommand(
      {
        actorUserId: 'user-1',
        teamId: 'team-1',
        practiceLocation: 'Fremont Bowl',
        practiceRecurrence: 'once',
      },
      { async updateTeamPractice() { return {}; } },
    ),
    /practiceOn is required/,
  );
});

test('formatTeamPracticeAnnouncement covers clear and once cases', () => {
  assert.match(
    formatTeamPracticeAnnouncement({
      teamName: 'Breakers',
      practiceRecurrence: 'once',
      practiceOn: '2026-08-20',
      practiceLocation: 'Fremont Bowl',
      practiceSchedule: '6pm',
    }),
    /One-off practice on 2026-08-20/,
  );
  assert.match(
    formatTeamPracticeAnnouncement({ teamName: 'Breakers' }),
    /cleared/,
  );
});

test('teams page exposes recurrence and membership practice display', () => {
  const html = renderTeamsPage();
  assert.match(html, /data-practice-recurrence/);
  assert.match(html, /data-practice-on/);
  assert.match(html, /One-off/);
  assert.match(html, /renderMembershipPractice/);
  assert.match(html, /Teammates were notified in team chat/);
});

test('recurrence migration expands set_team_practice', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260814143000_team_practice_recurrence.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /practice_recurrence/);
  assert.match(sql, /practice_on/);
  assert.match(sql, /weekly/);
  assert.match(sql, /once/);
});
