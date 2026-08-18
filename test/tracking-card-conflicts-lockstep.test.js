import test from 'node:test';
import assert from 'node:assert/strict';
import { findTrackingCardConflicts } from '../scripts/check-pr-card-contract.mjs';

function bodyFor(card) {
  return [
    '## Tracking card',
    `Tracks #${card}`,
    '',
    '## Owner lane / agent',
    'DRU',
  ].join('\n');
}

test('findTrackingCardConflicts returns empty when exclusive', () => {
  const conflicts = findTrackingCardConflicts({
    currentPullRequestNumber: 10,
    currentBody: bodyFor(1193),
    openPullRequests: [{ number: 11, body: bodyFor(2000), html_url: 'https://example/11' }],
    repositoryFullName: 'Fremont-Derby/fremontderby',
  });
  assert.deepEqual(conflicts, []);
});

test('findTrackingCardConflicts detects shared tracking card', () => {
  const conflicts = findTrackingCardConflicts({
    currentPullRequestNumber: 10,
    currentBody: bodyFor(1193),
    openPullRequests: [
      { number: 10, body: bodyFor(1193) },
      { number: 22, body: bodyFor(1193), html_url: 'https://example/22' },
    ],
    repositoryFullName: 'Fremont-Derby/fremontderby',
  });
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].cardNumber, 1193);
  assert.equal(conflicts[0].pullRequestNumber, 22);
});
