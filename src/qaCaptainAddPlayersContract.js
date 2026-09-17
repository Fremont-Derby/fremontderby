export const CAPTAIN_ADD_PLAYERS_MISSION = {
  missionId: 'captain.add-players',
  world: 'captain',
  persona: 'Captain',
  context: 'You recruited two new players and need them on your team before lineup planning.',
  action: 'Add only the intended eligible candidates to your team — not distractors or ineligible players.',
  entryMode: 'natural',
  estimatedSeconds: 60,
  status: 'fixture-ready',
  productRoutes: ['/', '/teams'],
  assertions: [
    { id: 'find-manage-team', type: 'human', text: 'I knew where to manage my team without being coached.' },
    { id: 'team-clear', type: 'human', text: 'It was obvious which team I was editing.' },
    { id: 'candidates-clear', type: 'human', text: 'Existing members and available candidates were distinguishable.' },
    { id: 'success-clear', type: 'human', text: 'After adding players, success was unmistakable.' },
    { id: 'intended-added', type: 'machine', text: 'Only the intended player IDs became members of the intended team.' },
    { id: 'roster-intact', type: 'machine', text: 'Existing roster members remained unchanged and no unintended candidate was added.' },
    { id: 'captain-enforced', type: 'machine', text: 'Captain permissions are required and enforced for the add.' },
    { id: 'invalid-blocked', type: 'mixed', text: 'An invalid or duplicate add is prevented with an explanation that makes sense.' },
    { id: 'fixture-contract', type: 'machine', text: 'The fixture has two intended candidates, a distractor, existing roster, and an optional ineligible candidate.' },
  ],
  randomizableFields: [
    'captainName',
    'existingMemberNames',
    'intendedNames',
    'distractorName',
    'ineligibleName',
    'teamName',
    'seasonName',
    'variant',
  ],
  invariants: [
    'exactly_two_intended_candidates',
    'existing_roster_unchanged',
    'no_unintended_adds',
    'captain_permission_required',
    'ineligible_or_duplicate_add_prevented',
  ],
};

const FIRST_NAMES = ['Nova', 'Maya', 'Eli', 'Riley', 'Theo', 'Jules', 'Mina', 'Dax'];
const LAST_NAMES = ['Banks', 'Torres', 'Chen', 'Brooks', 'Patel', 'Reed', 'Kim', 'Stone'];
const TEAM_WORDS_A = ['Break Room', 'Corner Pocket', 'Rail', 'Green Felt'];
const TEAM_WORDS_B = ['Bandits', 'Owls', 'Sharks', 'Crew'];
const SEASON_WORDS = ['Spring', 'Summer', 'Fall', 'Winter'];
const VARIANTS = ['happy-path', 'ineligible-blocked'];

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

function uniquePerson(random, used) {
  let name = personName(random);
  let guard = 0;
  while (used.has(name) && guard < 8) {
    name = `${personName(random)} ${used.size + 1}`;
    guard += 1;
  }
  used.add(name);
  return name;
}

function teamName(random) {
  return `${pick(random, TEAM_WORDS_A)} ${pick(random, TEAM_WORDS_B)}`;
}

export function buildCaptainAddPlayersFixture(seed) {
  const random = seeded(seed);
  const used = new Set();
  const captainName = uniquePerson(random, used);
  const existingMemberNames = [uniquePerson(random, used), uniquePerson(random, used)];
  const intendedNames = [uniquePerson(random, used), uniquePerson(random, used)];
  const distractorName = uniquePerson(random, used);
  const variant = pick(random, VARIANTS);
  const ineligibleName = variant === 'ineligible-blocked' ? uniquePerson(random, used) : null;
  const team = teamName(random);
  const seasonName = `${pick(random, SEASON_WORDS)} League`;

  const existingRoster = [captainName, ...existingMemberNames];

  return {
    schemaVersion: 1,
    missionId: CAPTAIN_ADD_PLAYERS_MISSION.missionId,
    seed,
    persona: 'captain',
    variant,
    captain: {
      id: `qa-${seed}-captain`,
      name: captainName,
      isCaptain: true,
      canAddPlayers: true,
    },
    team: {
      id: `qa-${seed}-team`,
      name: team,
      seasonId: `qa-${seed}-season`,
      seasonName,
      existingRoster,
    },
    intended: intendedNames.map((name, index) => ({
      id: `qa-${seed}-intended-${index + 1}`,
      name,
      eligible: true,
      intended: true,
    })),
    distractor: {
      id: `qa-${seed}-distractor`,
      name: distractorName,
      eligible: true,
      intended: false,
    },
    ineligible: ineligibleName
      ? {
          id: `qa-${seed}-ineligible`,
          name: ineligibleName,
          eligible: false,
          reason: 'Not eligible to join this team roster',
        }
      : null,
    product: {
      routes: ['/', '/teams'],
      homeRoute: '/',
      persistTeamKey: 'fd.teamId',
    },
    semantic: {
      exactly_two_intended_candidates: true,
      existing_roster_unchanged: true,
      no_unintended_adds: true,
      captain_permission_required: true,
      ineligible_or_duplicate_add_prevented: variant === 'ineligible-blocked',
    },
  };
}
