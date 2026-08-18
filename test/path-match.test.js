import test from 'node:test';
import assert from 'node:assert/strict';
import { matchApiTeamsPath, matchApiTeamsPathRegex } from '../src/pathMatch.js';

const cases = [
  ['/api/teams/abc/messages', { kind: 'messages', teamId: 'abc' }],
  ['/api/teams/abc/chat', { kind: 'messages', teamId: 'abc' }],
  ['/api/teams/abc/team-messages', { kind: 'messages', teamId: 'abc' }],
  ['/api/teams/abc/messages/read', { kind: 'messages-read', teamId: 'abc' }],
  ['/api/teams/abc/membership-request', { kind: 'membership-request', teamId: 'abc' }],
  ['/api/teams/ready-checks', { kind: 'ready-checks' }],
  ['/api/teams/abc/messages/extra', null],
  ['/api/seasons/x/messages', null],
];

test('split matcher covers team chat family', () => {
  for (const [path, expected] of cases) {
    assert.deepEqual(matchApiTeamsPath(path), expected, path);
  }
});

test('split matcher agrees with regex baseline on cases', () => {
  for (const [path] of cases) {
    assert.deepEqual(matchApiTeamsPath(path), matchApiTeamsPathRegex(path), path);
  }
});

import {
  matchApiTeamMatchesPath,
  matchApiSeasonMessagesPath,
} from '../src/pathMatch.js';

test('team-matches split matcher', () => {
  assert.deepEqual(
    matchApiTeamMatchesPath('/api/team-matches/tm1/chat'),
    { kind: 'messages', teamMatchId: 'tm1' },
  );
  assert.deepEqual(
    matchApiTeamMatchesPath('/api/team-matches/tm1/messages/read'),
    { kind: 'messages-read', teamMatchId: 'tm1' },
  );
  assert.deepEqual(
    matchApiTeamMatchesPath('/api/team-matches/tm1/team-choice/me'),
    { kind: 'team-choice', teamMatchId: 'tm1' },
  );
  assert.deepEqual(
    matchApiTeamMatchesPath('/api/team-matches/tm1/postseason-lineup'),
    { kind: 'postseason-lineup', teamMatchId: 'tm1' },
  );
  assert.equal(matchApiTeamMatchesPath('/api/teams/x/messages'), null);
});

test('season messages split matcher', () => {
  assert.deepEqual(
    matchApiSeasonMessagesPath('/api/seasons/s1/messages'),
    { kind: 'messages', seasonId: 's1' },
  );
  assert.deepEqual(
    matchApiSeasonMessagesPath('/api/seasons/s1/messages/read'),
    { kind: 'messages-read', seasonId: 's1' },
  );
  assert.equal(matchApiSeasonMessagesPath('/api/seasons/s1/schedule'), null);
});
