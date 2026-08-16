import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTeamPracticeAnnouncement } from '../src/teamCommands.js';

test('practice announcement has no dangling separator after colon', () => {
  const text = formatTeamPracticeAnnouncement({
    teamName: 'Breakers',
    practiceLocation: 'Fremont Billiards',
    practiceSchedule: 'Wed 7pm',
    practiceRecurrence: 'weekly',
  });
  assert.equal(
    text,
    'Practice update for Breakers: Weekly practice · Location: Fremont Billiards · Time: Wed 7pm',
  );
  assert.equal(
    formatTeamPracticeAnnouncement({ teamName: 'Breakers' }),
    'Practice for Breakers was cleared by the captain.',
  );
});
