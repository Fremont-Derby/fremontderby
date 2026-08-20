import test from 'node:test';
import assert from 'node:assert/strict';

import {
  chooseHomeNextAction,
  jflModernHomeStyles,
  renderJflModernHome,
  routeJflModernHome,
} from '../src/jflModernHome.js';

const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

test('modern Home has one clear heading and one dominant next-action region', () => {
  const html = renderJflModernHome();

  assert.match(html, /data-fd-modern-home="true"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/data-fd-next-action\b/g) || []).length, 1);
  assert.equal((html.match(/data-next-action-link\b/g) || []).length, 1);
  assert.match(html, /class="[^"]*fd-page-header/);
  assert.match(html, /class="[^"]*fd-card/);
});

test('next-action policy exposes only the task that is relevant now', () => {
  const signedOut = chooseHomeNextAction({ signedIn: false });
  assert.equal(signedOut.kind, 'signin');
  assert.equal(signedOut.href, '/profile');

  const scoring = chooseHomeNextAction({
    signedIn: true,
    scorableMatches: [{ id: 'match-hidden-from-copy' }],
    hasTeam: true,
    upcomingContext: { teamName: 'Break Artists' },
    isCaptain: true,
  });
  assert.equal(scoring.kind, 'score');
  assert.equal(scoring.href, '/scorecard');

  const captain = chooseHomeNextAction({
    signedIn: true,
    scorableMatches: [],
    hasTeam: true,
    upcomingContext: { teamName: 'Break Artists' },
    isCaptain: true,
  });
  assert.equal(captain.kind, 'lineup');
  assert.equal(captain.href, '/lineup');

  const player = chooseHomeNextAction({
    signedIn: true,
    scorableMatches: [],
    hasTeam: true,
    upcomingContext: { teamName: 'Break Artists' },
    isCaptain: false,
  });
  assert.equal(player.kind, 'availability');
  assert.equal(player.href, '/availability');

  const teamless = chooseHomeNextAction({
    signedIn: true,
    scorableMatches: [],
    hasTeam: false,
    upcomingContext: null,
  });
  assert.equal(teamless.kind, 'teams');
  assert.equal(teamless.href, '/teams#join-teams');
});

test('next-action copy and rendered Home never expose internal UUIDs', () => {
  const hiddenId = '11111111-1111-4111-8111-111111111111';
  const action = chooseHomeNextAction({
    signedIn: true,
    scorableMatches: [{ id: hiddenId }],
    hasTeam: true,
    upcomingContext: { roundId: hiddenId, teamMatchId: hiddenId, teamName: 'Break Artists' },
    isCaptain: false,
  });

  assert.doesNotMatch(JSON.stringify(action), UUID_RE);
  assert.doesNotMatch(renderJflModernHome(), UUID_RE);
});

test('Home slice is JFL GET / only and retains a reversible body fallback', async () => {
  const modern = routeJflModernHome(
    new Request('https://jfl.fremontderby.com/'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.ok(modern instanceof Response);
  assert.equal(modern.status, 200);
  assert.equal(modern.headers.get('x-fremont-ui-mode'), 'modern-home-v1');
  assert.match(await modern.text(), /data-fd-modern-home="true"/);

  assert.equal(
    routeJflModernHome(new Request('https://jfl.fremontderby.com/?ui=legacy'), { ENVIRONMENT: 'jfl' }),
    null,
  );
  assert.equal(
    routeJflModernHome(new Request('https://jfl.fremontderby.com/'), { ENVIRONMENT: 'production' }),
    null,
  );
  assert.equal(
    routeJflModernHome(new Request('https://jfl.fremontderby.com/schedule'), { ENVIRONMENT: 'jfl' }),
    null,
  );
  assert.equal(
    routeJflModernHome(new Request('https://jfl.fremontderby.com/', { method: 'POST' }), { ENVIRONMENT: 'jfl' }),
    null,
  );
});

test('modern Home keeps touch, focus, reduced-motion, and forced-colors contracts', () => {
  assert.match(jflModernHomeStyles, /min-height:\s*44px/);
  assert.match(jflModernHomeStyles, /:focus-visible/);
  assert.match(jflModernHomeStyles, /prefers-reduced-motion/);
  assert.match(jflModernHomeStyles, /forced-colors:\s*active/);
});
