export const AVAILABILITY_MISSION = {
  missionId: 'player.mark-availability',
  world: 'player',
  persona: 'Player',
  context: 'Your captain is building the next lineup and needs to know whether you can make it.',
  action: 'Mark whether you can play the intended upcoming night — not a teammate and not a different week.',
  entryMode: 'natural',
  estimatedSeconds: 45,
  status: 'fixture-ready',
  productRoutes: ['/', '/availability'],
  assertions: [
    { id: 'find-checkin', type: 'human', text: 'I knew where to report availability without being coached.' },
    { id: 'week-clear', type: 'human', text: 'I knew which week or match I was answering for.' },
    { id: 'state-clear', type: 'human', text: 'The selected available/unavailable state was unmistakable.' },
    { id: 'persisted', type: 'mixed', text: 'After saving, I trusted the new state would still be there on reload.' },
    { id: 'own-row-only', type: 'machine', text: 'Only this player\'s intended week changed. Teammate rows stayed put.' },
    { id: 'fixture-contract', type: 'machine', text: 'The fixture has one player, one intended week, a distractor teammate, and a start/final availability pair.' },
  ],
  randomizableFields: ['playerName', 'teammateName', 'captainName', 'teamName', 'seasonName', 'weekLabel', 'variant'],
  invariants: [
    'persona_edits_only_own_availability',
    'intended_week_distinct_from_other_weeks',
    'final_state_persists',
    'teammate_availability_unchanged',
  ],
};

const FIRST_NAMES = ['Nova', 'Maya', 'Eli', 'Riley', 'Theo', 'Jules', 'Mina', 'Dax'];
const LAST_NAMES = ['Banks', 'Torres', 'Chen', 'Brooks', 'Patel', 'Reed', 'Kim', 'Stone'];
const TEAM_WORDS_A = ['Break Room', 'Corner Pocket', 'Rail', 'Green Felt'];
const TEAM_WORDS_B = ['Bandits', 'Owls', 'Sharks', 'Crew'];
const SEASON_WORDS = ['Spring', 'Summer', 'Fall', 'Winter'];
const VARIANTS = [
  { id: 'unknown-available', start: 'unknown', final: 'available' },
  { id: 'unknown-unavailable', start: 'unknown', final: 'unavailable' },
  { id: 'available-unavailable', start: 'available', final: 'unavailable' },
];

function hashSeed(seed) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seed) {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, values) {
  return values[Math.floor(random() * values.length) % values.length];
}

function personName(random) {
  return `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`;
}

export function buildAvailabilityFixture(seed) {
  const random = seeded(seed);
  const playerName = personName(random);
  let teammateName = personName(random);
  if (teammateName === playerName) teammateName += ' T';
  let captainName = personName(random);
  if (captainName === playerName || captainName === teammateName) captainName += ' C';
  const variant = pick(random, VARIANTS);
  const weekNumber = 1 + Math.floor(random() * 8);
  const otherWeek = weekNumber === 8 ? 1 : weekNumber + 1;
  const teamName = `${pick(random, TEAM_WORDS_A)} ${pick(random, TEAM_WORDS_B)}`;
  const seasonName = `${pick(random, SEASON_WORDS)} League`;

  return {
    schemaVersion: 1,
    missionId: AVAILABILITY_MISSION.missionId,
    seed,
    persona: 'player',
    variant: variant.id,
    player: { id: `qa-${seed}-player`, name: playerName },
    teammate: { id: `qa-${seed}-teammate`, name: teammateName },
    captain: { id: `qa-${seed}-captain`, name: captainName },
    team: {
      id: `qa-${seed}-team`,
      name: teamName,
      seasonId: `qa-${seed}-season`,
      seasonName,
    },
    intendedWeek: {
      id: `qa-${seed}-week`,
      label: `Week ${weekNumber}`,
      startState: variant.start,
      finalState: variant.final,
    },
    distractorWeek: {
      id: `qa-${seed}-week-other`,
      label: `Week ${otherWeek}`,
    },
    product: {
      route: '/availability',
      homeRoute: '/',
      persistWeekKey: 'fd.availabilityWeekId',
    },
    semantic: {
      persona_edits_only_own_availability: true,
      intended_week_distinct_from_other_weeks: true,
      final_state_persists: true,
      teammate_availability_unchanged: true,
    },
  };
}
