import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

function contextKey(context) {
  return [context.participationType, context.teamId || 'free-agent', context.roundId].join('|');
}

function pickDefaultContext(contexts, { round = null, remembered = '', now = new Date() } = {}) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const onOrAfterToday = (context) => {
    const stamp = Date.parse(String(context.scheduledOn || '') + 'T12:00:00');
    return Number.isFinite(stamp) && stamp >= startOfToday.getTime();
  };
  const upcoming = contexts.find((context) => onOrAfterToday(context));
  const requestedContext = contexts.find((context) => context.roundId === round);
  const rememberedContext = remembered
    ? contexts.find((context) => contextKey(context) === remembered)
    : null;
  if (requestedContext) return requestedContext;
  if (rememberedContext && onOrAfterToday(rememberedContext)) return rememberedContext;
  if (upcoming) return upcoming;
  return contexts[0] || null;
}

test('availability page source prefers scheduledOn on or after today', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /const startOfToday=new Date\(\)/);
  assert.match(html, /const onOrAfterToday=\(context\)=>/);
  assert.match(html, /const upcoming=contexts\.find\(\(context\)=>onOrAfterToday\(context\)\)/);
  assert.match(html, /rememberedContext&&onOrAfterToday\(rememberedContext\)/);
  assert.doesNotMatch(
    html,
    /if\(requestedContext\)contextSelect\.value=contextKey\(requestedContext\);else if\(remembered&&contexts\.some\(\(context\)=>contextKey\(context\)===remembered\)\)contextSelect\.value=remembered;/,
  );
});

test('past nights are not the default when a later night exists', () => {
  const past = {
    participationType: 'roster',
    teamId: 'team-1',
    teamName: 'Breakers',
    roundId: 'round-past',
    roundNumber: 1,
    scheduledOn: '2026-09-03',
  };
  const next = {
    participationType: 'roster',
    teamId: 'team-1',
    teamName: 'Breakers',
    roundId: 'round-next',
    roundNumber: 2,
    scheduledOn: '2026-09-17',
  };
  const now = new Date('2026-09-17T15:00:00');

  const withPastRemembered = pickDefaultContext([past, next], {
    remembered: contextKey(past),
    now,
  });
  assert.equal(withPastRemembered.roundId, 'round-next');

  const withNoMemory = pickDefaultContext([past, next], { now });
  assert.equal(withNoMemory.roundId, 'round-next');

  const withFutureMemory = pickDefaultContext([past, next], {
    remembered: contextKey(next),
    now,
  });
  assert.equal(withFutureMemory.roundId, 'round-next');

  const urlWins = pickDefaultContext([past, next], {
    round: 'round-past',
    remembered: contextKey(next),
    now,
  });
  assert.equal(urlWins.roundId, 'round-past');
});
