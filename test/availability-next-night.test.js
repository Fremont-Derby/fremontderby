import assert from 'node:assert/strict';
import test from 'node:test';
import { repairAvailabilityScript } from '../src/availabilityScriptRepair.js';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

function contextKey(context) {
  return [context.participationType, context.teamId || 'free-agent', context.roundId].join('|');
}

function pickDefaultContext(contexts, { round = null, remembered = '', today = '2026-09-17' } = {}) {
  const onOrAfterToday = (context) => {
    const stamp = context.scheduledOn || context.scheduled_on || '';
    return Boolean(stamp && stamp >= today);
  };
  const requestedContext = contexts.find((context) => context.roundId === round);
  const rememberedContext = remembered
    ? contexts.find((context) => contextKey(context) === remembered)
    : null;
  if (requestedContext) return requestedContext;
  if (rememberedContext && onOrAfterToday(rememberedContext)) return rememberedContext;
  const withDate = contexts.filter((context) => context.scheduledOn || context.scheduled_on);
  const tonight = withDate.find((context) => (context.scheduledOn || context.scheduled_on) === today);
  const upcoming = withDate
    .filter((context) => (context.scheduledOn || context.scheduled_on) >= today)
    .sort((a, b) =>
      String(a.scheduledOn || a.scheduled_on).localeCompare(String(b.scheduledOn || b.scheduled_on)),
    )[0];
  return tonight || upcoming || contexts[0] || null;
}

test('availability repair skips past remembered nights when a later night exists', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /else if\(remembered&&contexts\.some/);
  const repaired = repairAvailabilityScript(html);
  assert.match(repaired, /rememberedContext&&onOrAfterToday\(rememberedContext\)/);
  assert.doesNotMatch(
    repaired,
    /else if\(remembered&&contexts\.some\(\(context\)=>contextKey\(context\)===remembered\)\)contextSelect\.value=remembered;/,
  );
  assert.match(repaired, /const onOrAfterToday=\(context\)=>/);
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

  assert.equal(pickDefaultContext([past, next], { remembered: contextKey(past) }).roundId, 'round-next');
  assert.equal(pickDefaultContext([past, next], {}).roundId, 'round-next');
  assert.equal(pickDefaultContext([past, next], { remembered: contextKey(next) }).roundId, 'round-next');
  assert.equal(
    pickDefaultContext([past, next], { round: 'round-past', remembered: contextKey(next) }).roundId,
    'round-past',
  );
});
