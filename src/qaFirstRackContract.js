export const FIRST_RACK_MISSION = {
  missionId: 'captain.score-first-rack',
  world: 'captain',
  persona: 'Captain',
  context: 'Your match just started. The first rack has to be scored before anyone argues about who broke.',
  action: 'Score the first rack for the intended match — not a later rack and not the other table.',
  entryMode: 'natural',
  estimatedSeconds: 50,
  status: 'fixture-ready',
  productRoutes: ['/', '/scorecard'],
  assertions: [
    { id: 'find-scorecard', type: 'human', text: 'I knew where to open scoring for this match.' },
    { id: 'rack-clear', type: 'human', text: 'It was obvious this was rack 1, not a later rack.' },
    { id: 'winner-clear', type: 'human', text: 'After I saved, the first-rack winner was unmistakable.' },
    { id: 'intended-match', type: 'machine', text: 'Only the intended match first rack was written.' },
    { id: 'other-table-untouched', type: 'machine', text: 'The distractor table and later racks stayed empty.' },
    { id: 'fixture-contract', type: 'machine', text: 'The fixture has one intended match, rack 1 empty, and a distractor table.' },
  ],
  randomizableFields: ['captainName', 'partnerName', 'opponentNames', 'teamName', 'tableNumber'],
  invariants: ['first_rack_only', 'intended_match_only', 'persona_is_captain', 'distractor_table_untouched'],
};

const FIRST_NAMES = ['Nova', 'Maya', 'Eli', 'Riley', 'Theo', 'Jules', 'Mina', 'Dax'];
const LAST_NAMES = ['Banks', 'Torres', 'Chen', 'Brooks', 'Patel', 'Reed', 'Kim', 'Stone'];
const TEAM_WORDS_A = ['Break Room', 'Corner Pocket', 'Rail', 'Green Felt'];
const TEAM_WORDS_B = ['Bandits', 'Owls', 'Sharks', 'Crew'];

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

export function buildFirstRackFixture(seed) {
  const random = seeded(seed);
  const captainName = personName(random);
  let partnerName = personName(random);
  if (partnerName === captainName) partnerName += ' P';
  const opponentNames = [personName(random), personName(random)];
  const teamName = `${pick(random, TEAM_WORDS_A)} ${pick(random, TEAM_WORDS_B)}`;
  const tableNumber = 1 + Math.floor(random() * 6);
  const otherTable = tableNumber === 6 ? 1 : tableNumber + 1;

  return {
    schemaVersion: 1,
    missionId: FIRST_RACK_MISSION.missionId,
    seed,
    persona: 'captain',
    captain: { id: `qa-${seed}-captain`, name: captainName, isCaptain: true },
    partner: { id: `qa-${seed}-partner`, name: partnerName },
    opponents: opponentNames.map((name, index) => ({ id: `qa-${seed}-opp-${index + 1}`, name })),
    team: { id: `qa-${seed}-team`, name: teamName },
    match: { id: `qa-${seed}-match`, tableNumber, intendedRack: 1, firstRackWinner: null },
    distractorMatch: { id: `qa-${seed}-match-other`, tableNumber: otherTable, intendedRack: 1 },
    product: { route: '/scorecard', homeRoute: '/' },
    semantic: {
      first_rack_only: true,
      intended_match_only: true,
      persona_is_captain: true,
      distractor_table_untouched: true,
    },
  };
}
