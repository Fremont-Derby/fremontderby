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
