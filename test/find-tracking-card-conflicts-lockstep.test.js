import test from 'node:test';
import assert from 'node:assert/strict';
import { findTrackingCardConflicts } from '../scripts/check-pr-card-contract.mjs';

test('findTrackingCardConflicts detects shared tracking cards across open PRs', () => {
  const currentBody = '## Tracking card\n\nTracks #1193\n';
  const openPullRequests = [
    { number: 10, body: '## Tracking card\n\nTracks #1193\n', html_url: 'https://example/10' },
    { number: 11, body: '## Tracking card\n\nTracks #42\n', html_url: 'https://example/11' },
  ];
  const conflicts = findTrackingCardConflicts({
    currentPullRequestNumber: 99,
    currentBody,
    openPullRequests,
    repositoryFullName: 'Fremont-Derby/fremontderby',
  });
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].cardNumber, 1193);
  assert.equal(conflicts[0].pullRequestNumber, 10);
});
