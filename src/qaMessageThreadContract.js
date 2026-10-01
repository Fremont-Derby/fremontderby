export const MESSAGE_THREAD_MISSION = {
  missionId: 'player.send-correct-message',
  world: 'player',
  persona: 'Player',
  context: 'You have unread league, team, and player conversations and must answer the requested thread only.',
  action: 'Find the specified unread message and reply in that conversation, not a distractor thread.',
  entryMode: 'natural',
  estimatedSeconds: 60,
  status: 'fixture-ready',
  productRoutes: ['/messages'],
  assertions: [
    { id: 'find-unread', type: 'human', text: 'I could find the requested unread message from preview text and unread state.' },
    { id: 'correct-thread', type: 'mixed', text: 'The reply landed only on the target conversation.' },
    { id: 'no-wrong-thread-mutation', type: 'machine', text: 'Distractor threads were not written.' },
    { id: 'fixture-contract', type: 'machine', text: 'The fixture has one target unread thread and at least two distractor threads of different scopes.' },
  ],
  randomizableFields: ['playerName', 'targetPreview', 'targetScope', 'replyText', 'distractorPreviews'],
  invariants: [
    'exactly_one_target_unread_thread',
    'distractor_threads_present',
    'reply_must_not_mutate_wrong_thread',
    'scopes_cover_league_team_player',
  ],
};

const FIRST_NAMES = ['Nova', 'Maya', 'Eli', 'Riley', 'Theo', 'Jules', 'Mina', 'Dax'];
const LAST_NAMES = ['Banks', 'Torres', 'Chen', 'Brooks', 'Patel', 'Reed', 'Kim', 'Stone'];
const PREVIEWS = [
  'Can you make Tuesday night?',
  'Bring an extra cue tip.',
  'League fee is due this week.',
  'Who is sitting out rack three?',
  'Ride share from Ballard?',
  'Practice table is booked at 6.',
];
const SCOPES = ['league', 'team', 'player'];

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

function uniquePreview(random, used) {
  let text = pick(random, PREVIEWS);
  if (used.has(text)) text = `${text} (${used.size + 1})`;
  used.add(text);
  return text;
}

export function buildMessageThreadFixture(seed) {
  const random = seeded(seed);
  const playerName = personName(random);
  const used = new Set();
  const targetScope = pick(random, SCOPES);
  const distractorScopes = SCOPES.filter((scope) => scope !== targetScope);
  const targetPreview = uniquePreview(random, used);
  const distractors = distractorScopes.map((scope, index) => ({
    threadId: `qa-${seed}-thread-d${index + 1}`,
    scope,
    preview: uniquePreview(random, used),
    unread: random() > 0.3,
    allowWrite: false,
  }));

  return {
    schemaVersion: 1,
    missionId: MESSAGE_THREAD_MISSION.missionId,
    seed,
    persona: 'player',
    player: { id: `qa-${seed}-player`, name: playerName },
    target: {
      threadId: `qa-${seed}-thread-target`,
      scope: targetScope,
      preview: targetPreview,
      unread: true,
      allowWrite: true,
      replyText: `Confirming for ${playerName.split(' ')[0]}.`,
    },
    distractors,
    product: { route: '/messages' },
    semantic: {
      exactly_one_target_unread_thread: true,
      distractor_threads_present: distractors.length >= 2,
      reply_must_not_mutate_wrong_thread: true,
      scopes_cover_league_team_player: new Set([targetScope, ...distractors.map((row) => row.scope)]).size === 3,
    },
  };
}
