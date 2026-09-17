export const TEAM_CONTEXT_MISSION = {
  missionId: 'player.understand-my-team',
  world: 'player',
  persona: 'Player',
  context: 'You play on more than one team. Open Home and identify the requested team\'s captain, roster, and season.',
  action: 'Name the captain, one teammate, and the active season for the requested team — not the distractor team.',
  entryMode: 'natural',
  estimatedSeconds: 45,
  status: 'fixture-ready',
  productRoutes: ['/', '/teams'],
  assertions: [
    { id: 'captain-visible', type: 'human', text: 'I could tell who captains the requested team without being told which card to open.' },
    { id: 'roster-visible', type: 'human', text: 'The requested roster stayed distinct from the distractor team roster.' },
    { id: 'season-visible', type: 'mixed', text: 'The requested season stayed visible after leaving and returning to the team.' },
    { id: 'fixture-contract', type: 'machine', text: 'The fixture has one target team with captain + roster and a distractor team/season.' },
  ],
  randomizableFields: ['playerName', 'captainName', 'teammateName', 'targetTeamName', 'distractorTeamName', 'targetSeasonName', 'distractorSeasonName'],
  invariants: [
    'persona_has_multiple_team_contexts',
    'target_team_has_named_captain',
    'target_roster_includes_persona',
    'target_season_distinct_from_distractor',
  ],
};

const FIRST_NAMES = ['Nova', 'Maya', 'Eli', 'Riley', 'Theo', 'Jules', 'Mina', 'Dax'];
const LAST_NAMES = ['Banks', 'Torres', 'Chen', 'Brooks', 'Patel', 'Reed', 'Kim', 'Stone'];
const TEAM_WORDS_A = ['Break Room', 'Corner Pocket', 'Rail', 'Green Felt'];
const TEAM_WORDS_B = ['Bandits', 'Owls', 'Sharks', 'Crew'];
const SEASON_WORDS = ['Spring', 'Summer', 'Fall', 'Winter'];

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

export function buildTeamContextFixture(seed) {
  const random = seeded(seed);
  const playerName = personName(random);
  let captainName = personName(random);
  if (captainName === playerName) captainName += ' C';
  let teammateName = personName(random);
  if (teammateName === playerName || teammateName === captainName) teammateName += ' T';
  const targetTeamName = teamName(random);
  let distractorTeamName = teamName(random);
  if (distractorTeamName === targetTeamName) distractorTeamName += ' II';
  const targetSeasonName = `${pick(random, SEASON_WORDS)} League`;
  let distractorSeasonName = `${pick(random, SEASON_WORDS)} League`;
  if (distractorSeasonName === targetSeasonName) distractorSeasonName = `${distractorSeasonName} B`;

  return {
    schemaVersion: 1,
    missionId: TEAM_CONTEXT_MISSION.missionId,
    seed,
    persona: 'player',
    player: { id: `qa-${seed}-player`, name: playerName },
    target: {
      seasonId: `qa-${seed}-season-target`,
      seasonName: targetSeasonName,
      teamId: `qa-${seed}-team-target`,
      teamName: targetTeamName,
      captainName,
      roster: [captainName, playerName, teammateName],
    },
    distractor: {
      seasonId: `qa-${seed}-season-distractor`,
      seasonName: distractorSeasonName,
      teamId: `qa-${seed}-team-distractor`,
      teamName: distractorTeamName,
      captainName: personName(random),
    },
    product: {
      route: '/teams',
      homeRoute: '/',
      persistTeamKey: 'fd.teamId',
      persistSeasonKey: 'fd.seasonId',
    },
    semantic: {
      persona_has_multiple_team_contexts: true,
      target_team_has_named_captain: true,
      target_roster_includes_persona: true,
      target_season_distinct_from_distractor: true,
    },
  };
}
