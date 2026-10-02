import assert from 'node:assert/strict';
import test from 'node:test';
import routerEntry from '../src/routerEntry.js';
import {
  captainFreeAgentContexts,
  safeFreeAgentCandidate,
} from '../src/jflFreeAgentsPage.js';

test('free-agent destination exposes canonical participation actions and captain search', async () => {
  const response = await routerEntry.fetch(new Request('https://jfl.fremontderby.com/free-agents'), { ENVIRONMENT: 'jfl' }, {});
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(html, /href="\/profile"/);
  assert.match(html, /href="\/schedule"/);
  assert.match(html, /href="\/teams"/);
  assert.match(html, /data-free-team/);
  assert.match(html, /data-free-round/);
  assert.match(html, /eligible-free-agents/);
  assert.match(html, /Check-in alone does not guarantee lineup eligibility/);
  assert.match(html, /data-nav-key="free-agents"/);
  assert.doesNotMatch(html, /phone_number|payment_status|service_role/i);
  const pageScript = html.match(/<script>\s*(\(\(\) => \{\s*const contextsFromManagement[\s\S]*?)<\/script>/)?.[1];
  assert.ok(pageScript, 'candidate interaction script is present');
  assert.doesNotThrow(() => new Function(pageScript));
});

test('free-agent destination is read-only and JFL-only', async () => {
  const write = await routerEntry.fetch(new Request('https://jfl.fremontderby.com/free-agents', { method: 'POST' }), { ENVIRONMENT: 'jfl' }, {});
  assert.equal(write.status, 405);
  assert.deepEqual(await write.json(), { error: 'Method not allowed' });

  const otherLane = await routerEntry.fetch(new Request('https://jfl.fremontderby.com/free-agents'), { ENVIRONMENT: 'dru' }, {});
  assert.doesNotMatch(await otherLane.text(), /data-free-agents/);
});

test('captain contexts include only unfinished published rounds', () => {
  const contexts = captainFreeAgentContexts({ captain_teams: [{
    teamId: 'team-1', teamName: 'Breakers', seasonName: 'Fall',
    lineupRounds: [
      { roundId: 'round-1', roundNumber: 1, scheduledOn: '2026-10-10', opponentName: 'Racks', teamMatchStatus: 'scheduled' },
      { roundId: 'round-2', roundNumber: 2, teamMatchStatus: 'finalized' },
    ],
  }] });
  assert.equal(contexts.length, 1);
  assert.equal(contexts[0].rounds.length, 1);
  assert.equal(contexts[0].rounds[0].roundId, 'round-1');
});

test('candidate presentation strips private and internal fields', () => {
  const candidate = safeFreeAgentCandidate({
    player_id: 'private-id', display_name: 'Morgan', fargo_rating: 525,
    rating_status: 'established', availability_status: 'available',
    phone_number: '555-0100', payment_status: 'unpaid', email: 'private@example.test',
  });
  assert.deepEqual(candidate, {
    displayName: 'Morgan', rating: 525, ratingStatus: 'established', availability: 'available',
  });
});
