export const NEXT_MATCH_MISSION = {
  missionId: 'player.find-next-match',
  world: 'player',
  persona: 'Player',
  context: 'Your week is filling up and you need to plan around league night.',
  action: 'Find when and where your team plays next, and who you face.',
  entryMode: 'natural',
  estimatedSeconds: 40,
  status: 'fixture-ready',
  productRoutes: ['/', '/schedule'],
  assertions: [
    { id: 'find-next', type: 'human', text: 'I knew where to look for my next match without being told the route.' },
    { id: 'team-match', type: 'human', text: 'I could tell this was my team\'s next match, not another week.' },
    { id: 'details-clear', type: 'human', text: 'Opponent, date, time, and table were easy to understand.' },
    { id: 'identity-matches', type: 'machine', text: 'The selected matchup identity matches the seeded next match.' },
    { id: 'no-captain-controls', type: 'machine', text: 'The persona has no captain or admin-only controls.' },
    { id: 'fixture-contract', type: 'machine', text: 'The fixture has exactly one upcoming team match and a past or later distractor.' },
  ],
  randomizableFields: ['playerName', 'teamName', 'opponentName', 'venueName', 'startsAt', 'tableNumber'],
  invariants: [
    'exactly_one_next_match',
    'match_is_in_the_future',
    'persona_is_rostered_player',
    'persona_is_not_captain',
  ],
};

const FIRST_NAMES = ['Nova', 'Maya', 'Eli', 'Riley', 'Theo', 'Jules', 'Mina', 'Dax'];
const LAST_NAMES = ['Banks', 'Torres', 'Chen', 'Brooks', 'Patel', 'Reed', 'Kim', 'Stone'];
const TEAM_WORDS_A = ['Break Room', 'Corner Pocket', 'Rail', 'Green Felt'];
const TEAM_WORDS_B = ['Bandits', 'Owls', 'Sharks', 'Crew'];
const VENUES = ['Fremont Billiards', 'The Cue Room', 'Harbor Hall', 'North End Tables'];

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

function teamName(random) {
  return `${pick(random, TEAM_WORDS_A)} ${pick(random, TEAM_WORDS_B)}`;
}

export function buildNextMatchFixture(seed) {
  const random = seeded(seed);
  const playerName = personName(random);
  const team = teamName(random);
  let opponent = teamName(random);
  if (opponent === team) opponent += ' II';
  const tableNumber = 1 + Math.floor(random() * 8);
  const nextStarts = '2026-09-24T02:00:00Z';
  const pastStarts = '2026-09-10T02:00:00Z';
  const laterStarts = '2026-10-01T02:00:00Z';

  return {
    schemaVersion: 1,
    missionId: NEXT_MATCH_MISSION.missionId,
    seed,
    persona: 'player',
    player: { id: `qa-${seed}-player`, name: playerName, isCaptain: false },
    team: { id: `qa-${seed}-team`, name: team },
    nextMatch: {
      id: `qa-${seed}-match-next`,
      team_id: `qa-${seed}-team`,
      home_team_id: `qa-${seed}-team`,
      home_team_name: team,
      away_team_name: opponent,
      starts_at: nextStarts,
      venueName: pick(random, VENUES),
      tableNumber,
    },
    distractors: [
      {
        id: `qa-${seed}-match-past`,
        team_id: `qa-${seed}-team`,
        home_team_name: team,
        away_team_name: opponent,
        starts_at: pastStarts,
      },
      {
        id: `qa-${seed}-match-later`,
        team_id: `qa-${seed}-other`,
        home_team_name: opponent,
        away_team_name: team,
        starts_at: laterStarts,
      },
    ],
    product: { route: '/schedule', homeRoute: '/' },
    semantic: {
      exactly_one_next_match: true,
      match_is_in_the_future: true,
      persona_is_rostered_player: true,
      persona_is_not_captain: true,
    },
  };
}
