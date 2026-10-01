export const STANDINGS_CONTEXT_MISSION = {
  missionId: 'player.find-standings-context',
  world: 'player',
  persona: 'Player',
  context: 'You play on more than one team and need the requested team standing, not your individual rank.',
  action: 'Find the requested team standing and keep it distinct from individual standings after a season switch.',
  entryMode: 'natural',
  estimatedSeconds: 45,
  status: 'fixture-ready',
  productRoutes: ['/standings'],
  assertions: [
    { id: 'discover-team-tab', type: 'human', text: 'I could tell team standings apart from individual standings without being told which tab to open.' },
    { id: 'requested-team-clear', type: 'human', text: 'The requested team rank stayed identifiable among distractor teams.' },
    { id: 'season-persists', type: 'mixed', text: 'Changing season and returning still showed the requested season and view.' },
    { id: 'fixture-contract', type: 'machine', text: 'The fixture has one target team rank, a distractor team, and a distinct individual rank.' },
  ],
  randomizableFields: ['playerName', 'targetTeamName', 'distractorTeamName', 'targetSeasonName', 'distractorSeasonName', 'teamRank', 'individualRank'],
  invariants: [
    'persona_has_multiple_team_contexts',
    'team_standings_distinct_from_individual',
    'target_season_distinct_from_distractor',
    'requested_team_has_unique_rank',
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

function distinctRank(random, other) {
  let rank = 1 + Math.floor(random() * 8);
  if (rank === other) rank = rank === 8 ? 1 : rank + 1;
  return rank;
}

export function buildStandingsContextFixture(seed) {
  const random = seeded(seed);
  const playerName = personName(random);
  const targetTeamName = teamName(random);
  let distractorTeamName = teamName(random);
  if (distractorTeamName === targetTeamName) distractorTeamName += ' II';
  const targetSeasonName = `${pick(random, SEASON_WORDS)} League`;
  let distractorSeasonName = `${pick(random, SEASON_WORDS)} League`;
  if (distractorSeasonName === targetSeasonName) distractorSeasonName = `${distractorSeasonName} B`;
  const teamRank = 1 + Math.floor(random() * 8);
  const individualRank = distinctRank(random, teamRank);
  const distractorTeamRank = distinctRank(random, teamRank);

  return {
    schemaVersion: 1,
    missionId: STANDINGS_CONTEXT_MISSION.missionId,
    seed,
    persona: 'player',
    player: { id: `qa-${seed}-player`, name: playerName },
    target: {
      seasonId: `qa-${seed}-season-target`,
      seasonName: targetSeasonName,
      teamId: `qa-${seed}-team-target`,
      teamName: targetTeamName,
      teamRank,
      view: 'teams',
    },
    distractor: {
      seasonId: `qa-${seed}-season-distractor`,
      seasonName: distractorSeasonName,
      teamId: `qa-${seed}-team-distractor`,
      teamName: distractorTeamName,
      teamRank: distractorTeamRank,
      view: 'individuals',
      individualRank,
    },
    product: {
      route: '/standings',
      persistSeasonKey: 'fd.standingsSeasonId',
      persistViewKey: 'fd.standingsView',
    },
    semantic: {
      persona_has_multiple_team_contexts: true,
      team_standings_distinct_from_individual: true,
      target_season_distinct_from_distractor: true,
      requested_team_has_unique_rank: true,
    },
  };
}
