import test from 'node:test';
import assert from 'node:assert/strict';
import { matchApiTeamsPath } from '../src/pathMatch.js';

test('matchApiTeamsPath recognizes practice', () => {
  assert.deepEqual(matchApiTeamsPath('/api/teams/t1/practice'), {
    kind: 'practice',
    teamId: 't1',
  });
});

test('matchApiTeamsPath still matches messages', () => {
  assert.deepEqual(matchApiTeamsPath('/api/teams/t1/messages'), {
    kind: 'messages',
    teamId: 't1',
  });
});
