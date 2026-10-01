export const CAPTAINCY_TRANSFER_MISSION = {
  missionId: 'captain.transfer-captaincy',
  world: 'captain',
  persona: 'Captain',
  context: 'You are stepping down. Another eligible teammate has agreed to take over your team.',
  action: 'Hand captain responsibility to the intended eligible teammate, not a distractor or ineligible candidate.',
  entryMode: 'natural',
  estimatedSeconds: 60,
  status: 'fixture-ready',
  productRoutes: ['/', '/teams'],
  assertions: [
    { id: 'find-transfer', type: 'human', text: 'I could find how to transfer captaincy without being coached.' },
    { id: 'target-clear', type: 'human', text: 'The intended successor was unmistakable before I confirmed.' },
    { id: 'consequence-clear', type: 'human', text: 'I understood I would lose captain-only powers after the transfer.' },
    { id: 'successor-is-captain', type: 'machine', text: 'The intended successor became captain and the former captain lost captain-only authorization.' },
    { id: 'no-dual-captain', type: 'machine', text: 'Exactly one captain remains; roster identity otherwise unchanged.' },
    { id: 'ineligible-blocked', type: 'mixed', text: 'An ineligible transfer target is prevented with an obvious recovery path.' },
    { id: 'fixture-contract', type: 'machine', text: 'The fixture has one intended successor, roster distractors, and an optional ineligible candidate.' },
  ],
  randomizableFields: ['captainName', 'successorName', 'distractorNames', 'ineligibleName', 'teamName', 'seasonName', 'variant'],
  invariants: ['exactly_one_intended_successor', 'former_captain_loses_authority', 'roster_otherwise_unchanged', 'ineligible_transfer_prevented', 'no_dual_captain_state'],
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

export function buildCaptaincyTransferFixture(seed) {
  const random = seeded(seed);
  const used = new Set();
  const captainName = uniquePerson(random, used);
  const successorName = uniquePerson(random, used);
  const distractorNames = [uniquePerson(random, used), uniquePerson(random, used)];
  const variant = pick(random, VARIANTS);
  const ineligibleName = variant === 'ineligible-blocked' ? uniquePerson(random, used) : null;
  const team = teamName(random);
  const seasonName = `${pick(random, SEASON_WORDS)} League`;
  const roster = [captainName, successorName, ...distractorNames];
  if (ineligibleName) roster.push(ineligibleName);

  return {
    schemaVersion: 1,
    missionId: CAPTAINCY_TRANSFER_MISSION.missionId,
    seed,
    persona: 'captain',
    variant,
    captain: { id: `qa-${seed}-captain`, name: captainName, isCaptain: true, afterTransferIsCaptain: false },
    team: { id: `qa-${seed}-team`, name: team, seasonId: `qa-${seed}-season`, seasonName, roster },
    successor: { id: `qa-${seed}-successor`, name: successorName, eligible: true, afterTransferIsCaptain: true },
    distractors: distractorNames.map((name, index) => ({ id: `qa-${seed}-distractor-${index + 1}`, name, eligible: true, intended: false })),
    ineligible: ineligibleName ? { id: `qa-${seed}-ineligible`, name: ineligibleName, eligible: false, reason: 'Not on active roster eligibility for captaincy' } : null,
    product: { routes: ['/', '/teams'], homeRoute: '/', persistTeamKey: 'fd.teamId' },
    semantic: {
      exactly_one_intended_successor: true,
      former_captain_loses_authority: true,
      roster_otherwise_unchanged: true,
      ineligible_transfer_prevented: variant === 'ineligible-blocked',
      no_dual_captain_state: true,
    },
  };
}
