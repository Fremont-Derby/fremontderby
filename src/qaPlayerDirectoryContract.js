export const PLAYER_DIRECTORY_MISSION = {
  missionId: 'player.find-in-directory',
  world: 'player',
  persona: 'Player',
  context: 'You need to confirm a published name is on the public directory before you message a captain.',
  action: 'Find the intended published player name. Contact numbers and IDs must stay hidden.',
  entryMode: 'natural',
  estimatedSeconds: 30,
  status: 'fixture-ready',
  productRoutes: ['/', '/players'],
  assertions: [
    { id: 'find-directory', type: 'human', text: 'I knew where the public player list lived.' },
    { id: 'name-clear', type: 'human', text: 'The intended name was easy to spot after search or ?player=.' },
    { id: 'no-private', type: 'machine', text: 'The page does not expose player_id, phone, or payment fields.' },
    { id: 'requested-marked', type: 'machine', text: 'The intended name can be marked data-requested-player.' },
    { id: 'fixture-contract', type: 'machine', text: 'The fixture has one intended name and at least one distractor name.' },
  ],
  randomizableFields: ['intendedName', 'distractorNames'],
  invariants: ['public_names_only', 'intended_name_unique', 'no_contact_fields'],
};

const FIRST_NAMES = ['Nova', 'Maya', 'Eli', 'Riley', 'Theo', 'Jules', 'Mina', 'Dax'];
const LAST_NAMES = ['Banks', 'Torres', 'Chen', 'Brooks', 'Patel', 'Reed', 'Kim', 'Stone'];

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

export function buildPlayerDirectoryFixture(seed) {
  const random = seeded(seed);
  const intendedName = personName(random);
  const distractorNames = [personName(random), personName(random)].map((name, index) => (
    name === intendedName ? `${name} ${index + 2}` : name
  ));

  return {
    schemaVersion: 1,
    missionId: PLAYER_DIRECTORY_MISSION.missionId,
    seed,
    persona: 'player',
    intended: { name: intendedName, query: `?player=${encodeURIComponent(intendedName)}` },
    distractors: distractorNames.map((name) => ({ name })),
    product: {
      route: '/players',
      homeRoute: '/',
      requestedAttr: 'data-requested-player',
    },
    semantic: {
      public_names_only: true,
      intended_name_unique: true,
      no_contact_fields: true,
    },
  };
}
