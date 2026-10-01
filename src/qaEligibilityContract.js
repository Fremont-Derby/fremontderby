export const ELIGIBILITY_MISSION = {
  missionId: 'player.check-eligibility',
  world: 'player',
  persona: 'Player',
  context: 'You need to know whether you already qualify for the requested season and team, without doing the math by hand.',
  action: 'Find qualification state and plays remaining for the specified season and team.',
  entryMode: 'natural',
  estimatedSeconds: 45,
  status: 'fixture-ready',
  productRoutes: ['/standings', '/profile'],
  assertions: [
    { id: 'state-visible', type: 'human', text: 'I could see whether I was qualified without calculating hidden rules.' },
    { id: 'plays-remaining-clear', type: 'mixed', text: 'Plays remaining matched the fixture for the requested team and season.' },
    { id: 'anti-ringer-context', type: 'human', text: 'The eligibility applied to the requested team, not a distractor team.' },
    { id: 'fixture-contract', type: 'machine', text: 'The fixture uses one of qualified, one-play-short, or several-plays-short and names a distractor team.' },
  ],
  randomizableFields: ['playerName', 'targetTeamName', 'distractorTeamName', 'seasonName', 'variant', 'matchesPlayed', 'minimumMatches'],
  invariants: [
    'eligibility_is_team_and_season_specific',
    'human_does_not_compute_hidden_rules',
    'variant_is_one_of_three_states',
    'distractor_team_present',
  ],
};

const FIRST_NAMES = ['Nova', 'Maya', 'Eli', 'Riley', 'Theo', 'Jules', 'Mina', 'Dax'];
const LAST_NAMES = ['Banks', 'Torres', 'Chen', 'Brooks', 'Patel', 'Reed', 'Kim', 'Stone'];
const TEAM_WORDS_A = ['Break Room', 'Corner Pocket', 'Rail', 'Green Felt'];
const TEAM_WORDS_B = ['Bandits', 'Owls', 'Sharks', 'Crew'];
const VARIANTS = ['qualified', 'one-play-short', 'several-plays-short'];

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

function countsFor(variant, minimumMatches) {
  if (variant === 'qualified') {
    return { matchesPlayed: minimumMatches + 1, playsRemaining: 0, qualified: true };
  }
  if (variant === 'one-play-short') {
    return { matchesPlayed: minimumMatches - 1, playsRemaining: 1, qualified: false };
  }
  return { matchesPlayed: Math.max(0, minimumMatches - 3), playsRemaining: 3, qualified: false };
}

export function buildEligibilityFixture(seed) {
  const random = seeded(seed);
  const playerName = personName(random);
  const targetTeamName = teamName(random);
  let distractorTeamName = teamName(random);
  if (distractorTeamName === targetTeamName) distractorTeamName += ' II';
  const variant = pick(random, VARIANTS);
  const minimumMatches = 8;
  const counts = countsFor(variant, minimumMatches);
  const seasonName = `${pick(random, ['Spring', 'Summer', 'Fall', 'Winter'])} League`;

  return {
    schemaVersion: 1,
    missionId: ELIGIBILITY_MISSION.missionId,
    seed,
    persona: 'player',
    variant,
    player: { id: `qa-${seed}-player`, name: playerName },
    target: {
      seasonId: `qa-${seed}-season`,
      seasonName,
      teamId: `qa-${seed}-team-target`,
      teamName: targetTeamName,
      minimumMatches,
      matchesPlayed: counts.matchesPlayed,
      playsRemaining: counts.playsRemaining,
      qualified: counts.qualified,
    },
    distractor: {
      teamId: `qa-${seed}-team-distractor`,
      teamName: distractorTeamName,
      qualified: !counts.qualified,
    },
    product: {
      routes: ['/standings', '/profile'],
      prizeBadge: counts.qualified ? `Eligible` : `Needs ${counts.playsRemaining}`,
    },
    semantic: {
      eligibility_is_team_and_season_specific: true,
      human_does_not_compute_hidden_rules: true,
      variant_is_one_of_three_states: VARIANTS.includes(variant),
      distractor_team_present: true,
    },
  };
}
