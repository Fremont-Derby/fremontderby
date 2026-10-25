const FIRST_NAMES = ['Nova', 'Maya', 'Eli', 'Riley', 'Theo', 'Jules', 'Mina', 'Dax', 'Ivy', 'Owen', 'Zara', 'Nico'];
const LAST_NAMES = ['Banks', 'Torres', 'Chen', 'Brooks', 'Patel', 'Reed', 'Kim', 'Stone', 'Park', 'Lane', 'Diaz', 'Cole'];
const TEAM_WORDS_A = ['Break Room', 'Corner Pocket', 'Rail', 'Green Felt', 'Side Pocket', 'Hill Hill'];
const TEAM_WORDS_B = ['Bandits', 'Owls', 'Sharks', 'Crew', 'Breakers', 'Runners'];
const VENUES = ['4B’s Tavern', 'Northside Billiards', 'Green Lake Pool Room', 'Ballard Break Room'];

export const QA_MISSIONS = [
  {
    missionId: 'player.find-next-match',
    world: 'player',
    persona: 'Player',
    context: 'Your week is filling up and you need to plan around league night.',
    action: 'Find when and where you play next, and who your team faces.',
    entryMode: 'natural',
    estimatedSeconds: 45,
    status: 'fixture-ready',
    productRoutes: ['/','/schedule'],
    assertions: [
      { id: 'discover-next-match', type: 'human', text: 'I knew where to look for my next match without instructions.' },
      { id: 'identity-clear', type: 'human', text: 'It was obvious which team and opponent the match belonged to.' },
      { id: 'fixture-contract', type: 'machine', text: 'The mission fixture contains one unambiguous upcoming match.' },
      { id: 'date-location-clear', type: 'mixed', text: 'The date/time and location were present and understandable.' },
    ],
    randomizableFields: ['playerName','teamName','opponentName','roundNumber','date','time','venue'],
    invariants: ['exactly_one_next_match','match_is_future','persona_is_rostered_player'],
  },
  {
    missionId: 'player.understand-team',
    world: 'player',
    persona: 'Player',
    context: 'You play on more than one team this season and need to know who is on one specific roster.',
    action: 'Find the captain, roster, and season for the requested team.',
    entryMode: 'natural',
    estimatedSeconds: 60,
    status: 'fixture-ready',
    productRoutes: ['/','/teams'],
    assertions: [
      { id: 'team-context-clear', type: 'human', text: 'I could tell which team and season I was viewing.' },
      { id: 'captain-clear', type: 'human', text: 'The captain was easy to identify.' },
      { id: 'roster-clear', type: 'human', text: 'The roster was easy to scan.' },
      { id: 'multi-team-safe', type: 'mixed', text: 'I did not confuse another team or season with the requested one.' },
    ],
    randomizableFields: ['playerName','targetTeamName','otherTeamName','captainName','rosterNames','seasonNames'],
    invariants: ['persona_has_multiple_team_contexts','target_team_has_one_captain','target_roster_is_unambiguous'],
  },
  {
    missionId: 'player.mark-availability',
    world: 'player',
    persona: 'Player',
    context: 'Your captain is building the next lineup and needs to know whether you can make it.',
    action: 'Mark whether you can play in the upcoming match.',
    entryMode: 'natural',
    estimatedSeconds: 45,
    status: 'coming-next',
    productRoutes: ['/','/availability'],
    assertions: [
      { id: 'find-availability', type: 'human', text: 'I could find where to report availability.' },
      { id: 'saved-state-clear', type: 'mixed', text: 'After choosing an answer, it was obvious what state was saved.' },
      { id: 'availability-persisted', type: 'machine', text: 'The selected availability state persisted for the intended week.' },
    ],
    randomizableFields: ['playerName','teamName','opponentName','roundNumber','startingAvailability'],
    invariants: ['upcoming_match_exists','player_can_edit_own_availability'],
  },
  {
    missionId: 'captain.add-players',
    world: 'captain',
    persona: 'Captain',
    context: 'You recruited two new players and need them on your team before lineup planning.',
    action: 'Add the correct new players to your team.',
    entryMode: 'natural',
    estimatedSeconds: 75,
    status: 'coming-next',
    productRoutes: ['/','/teams'],
    assertions: [
      { id: 'find-team-management', type: 'human', text: 'I knew how to get to my team management controls.' },
      { id: 'correct-team', type: 'human', text: 'I could tell I was editing the correct team.' },
      { id: 'intended-members-added', type: 'machine', text: 'Only the intended randomized players were added.' },
      { id: 'success-clear', type: 'human', text: 'It was obvious the roster update succeeded.' },
    ],
    randomizableFields: ['captainName','teamName','candidateNames','distractorNames'],
    invariants: ['persona_is_team_captain','two_eligible_candidates','at_least_one_distractor'],
  },
  {
    missionId: 'captain.transfer-captaincy',
    world: 'captain',
    persona: 'Captain',
    context: 'You are stepping down and another eligible teammate has agreed to take over.',
    action: 'Hand captain responsibility to the correct teammate.',
    entryMode: 'natural',
    estimatedSeconds: 75,
    status: 'coming-next',
    productRoutes: ['/','/teams','/profile'],
    assertions: [
      { id: 'find-transfer', type: 'human', text: 'I could find how to transfer captain responsibility.' },
      { id: 'target-clear', type: 'human', text: 'It was clear which teammate would become captain.' },
      { id: 'authority-transferred', type: 'machine', text: 'Captain authority moved to the intended teammate.' },
      { id: 'old-authority-removed', type: 'machine', text: 'The former captain no longer retained captain-only authority.' },
    ],
    randomizableFields: ['captainName','successorName','teamName','teammateNames'],
    invariants: ['persona_is_current_captain','successor_is_eligible_teammate'],
  },
  {
    missionId: 'captain.score-first-rack',
    world: 'captain',
    persona: 'Captain',
    context: 'The match just started and you are the captain entering scores for your side.',
    action: 'Record the first rack correctly without being told which control to press.',
    entryMode: 'deep_link',
    estimatedSeconds: 60,
    status: 'playable',
    productRoutes: ['/scorecard'],
    assertions: [
      { id: 'start-scoring-obvious', type: 'human', text: 'I immediately knew how to start scoring.' },
      { id: 'opening-order-clear', type: 'human', text: 'The selected opening order was unmistakable.' },
      { id: 'winner-choice-stays-open', type: 'mixed', text: 'Winner choices stayed visible until I selected one.' },
      { id: 'rack-recorded', type: 'machine', text: 'Rack 1 was recorded and the ledger score changed.' },
      { id: 'premature-confirm-blocked', type: 'mixed', text: 'Confirmation remained unavailable while the race was incomplete.' },
    ],
    randomizableFields: ['playerNames','teamNames','ratings','raceTargets','openingDiscipline','roundNumber'],
    invariants: ['valid_unscored_race','persona_is_scoring_captain','race_is_non_terminal'],
    playHref: '/qa/scorecard/play?level=fresh',
  },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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

export function buildQaMissionFixture(missionId, seed) {
  const mission = QA_MISSIONS.find((item) => item.missionId === missionId);
  if (!mission) return null;
  const random = seeded(seed);

  if (missionId === 'player.understand-team') {
    const playerName = personName(random);
    const targetTeam = teamName(random);
    let otherTeam = teamName(random);
    if (otherTeam === targetTeam) otherTeam += ' II';
    const captainName = personName(random);
    const roster = [captainName, playerName];
    while (roster.length < 5) {
      const name = personName(random);
      if (!roster.includes(name)) roster.push(name);
    }
    return {
      schemaVersion: 1, missionId, seed, persona: 'player',
      player: { id: `qa-${seed}-player`, name: playerName },
      target: { teamId: `qa-${seed}-team-a`, teamName: targetTeam, seasonId: `qa-${seed}-season-a`, seasonName: 'QA Autumn ' + (2030 + Math.floor(random()*3)), captainName, roster },
      distractor: { teamId: `qa-${seed}-team-b`, teamName: otherTeam, seasonId: `qa-${seed}-season-b`, seasonName: 'QA Spring ' + (2030 + Math.floor(random()*3)), captainName: personName(random), roster: [playerName, personName(random), personName(random)] },
      semantic: { persona_has_multiple_team_contexts: true, target_team_has_one_captain: true, target_roster_is_unambiguous: true },
    };
  }

  if (missionId === 'player.find-next-match') {
    const playerName = personName(random);
    const ownTeam = teamName(random);
    let opponent = teamName(random);
    if (opponent === ownTeam) opponent += ' II';
    const roundNumber = 1 + Math.floor(random() * 10);
    const dayOffset = 2 + Math.floor(random() * 12);
    const date = new Date(Date.UTC(2030, 0, 1 + dayOffset)).toISOString().slice(0, 10);
    const hour = 18 + Math.floor(random() * 3);
    return {
      schemaVersion: 1,
      missionId,
      seed,
      persona: 'player',
      player: { id: `qa-${seed}-player`, name: playerName },
      team: { id: `qa-${seed}-team`, name: ownTeam },
      nextMatch: {
        id: `qa-${seed}-match`,
        roundNumber,
        opponent: { id: `qa-${seed}-opponent`, name: opponent },
        date,
        time: `${String(hour).padStart(2, '0')}:00`,
        venue: pick(random, VENUES),
      },
      semantic: { exactlyOneNextMatch: true, matchIsFuture: true, personaIsRosteredPlayer: true },
    };
  }

  return {
    schemaVersion: 1,
    missionId,
    seed,
    persona: mission.world,
    semantic: Object.fromEntries(mission.invariants.map((key) => [key, true])),
  };
}

function newSeed() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID().slice(0, 8);
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function missionCard(mission) {
  const status = mission.status === 'playable' ? 'PLAYABLE' : mission.status === 'fixture-ready' ? 'FIXTURE READY' : 'COMING NEXT';
  const primary = mission.status === 'playable'
    ? `<a class="primary" href="${escapeHtml(mission.playHref)}">Start mission</a>`
    : mission.status === 'fixture-ready'
      ? `<a class="secondary" href="/qa/mission/preview?mission=${encodeURIComponent(mission.missionId)}">Preview randomized mission</a>`
      : `<button type="button" disabled title="Mission fixture integration is not wired yet">Coming next</button>`;
  return `<article class="mission"><div class="mission-top"><span class="status">${status}</span><span class="time">~${mission.estimatedSeconds < 60 ? mission.estimatedSeconds + ' sec' : Math.ceil(mission.estimatedSeconds / 60) + ' min'}</span></div><h3>You are a ${escapeHtml(mission.persona.toLowerCase())}.</h3><p class="context">${escapeHtml(mission.context)}</p><p class="action"><strong>You want to:</strong> ${escapeHtml(mission.action)}</p><div class="entry">Entry: ${mission.entryMode === 'natural' ? 'natural navigation' : 'focused deep link'}</div>${primary}</article>`;
}

function renderCampaign(buildSha) {
  const worlds = ['player','captain'];
  const sections = worlds.map((world) => {
    const missions = QA_MISSIONS.filter((mission) => mission.world === world).map(missionCard).join('');
    return `<section class="world"><div class="world-title"><span>${world.toUpperCase()} WORLD</span><h2>${world === 'player' ? 'Play as a player' : 'Run your team as captain'}</h2></div><div class="missions">${missions}</div></section>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Human QA Missions · Fremont Derby</title><style>:root{font-family:Inter,system-ui,sans-serif;background:#f4f7f5;color:#14231b}*{box-sizing:border-box}body{margin:0}.wrap{width:min(820px,calc(100% - 20px));margin:20px auto 44px}.eyebrow{font-size:.72rem;font-weight:950;letter-spacing:.08em;color:#08783f}.hero h1{font-size:clamp(1.8rem,8vw,3rem);margin:4px 0 8px}.hero p{margin:0;color:#526057;line-height:1.45}.build{font-size:.68rem;color:#6a756e;margin-top:8px}.world{margin-top:24px}.world-title span{font-size:.68rem;font-weight:950;color:#08783f}.world-title h2{margin:2px 0 10px;font-size:1.25rem}.missions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mission{background:#fff;border:1px solid #bdc7c1;border-radius:16px;padding:14px;min-width:0}.mission-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.status{font-size:.62rem;font-weight:950;color:#08783f}.time,.entry{font-size:.68rem;color:#6a756e}.mission h3{font-size:1rem;margin:8px 0 4px}.context{font-size:.78rem;color:#667269;line-height:1.35;margin:0 0 8px}.action{font-size:.9rem;line-height:1.4;margin:0 0 8px}.mission a,.mission button{margin-top:12px;display:flex;width:100%;min-height:48px;align-items:center;justify-content:center;border-radius:11px;font-weight:900;text-decoration:none;border:1px solid #08783f;padding:8px}.primary{background:#08783f;color:#fff}.secondary{background:#fff;color:#08783f}.mission button:disabled{border-color:#cfd5d1;color:#7b857e;background:#edf0ee}.footer{margin-top:24px;border-top:1px solid #d4dad6;padding-top:12px;color:#667269;font-size:.75rem;line-height:1.4}@media(max-width:620px){.missions{grid-template-columns:1fr}.wrap{width:min(100% - 12px,820px);margin-top:12px}}</style></head><body><main class="wrap"><section class="hero"><div class="eyebrow">JFL HUMAN QA · PERSONA MISSIONS</div><h1>Pick a role. Complete the mission.</h1><p>We tell you who you are and what you want. We do not tell you where to click when discoverability is part of the test.</p><div class="build">Build <code>${escapeHtml(buildSha)}</code></div></section>${sections}<div class="footer">Fresh runs use seeded randomized data. Playable missions exercise the QA product fixture; “fixture ready” means the randomized Arrange contract exists but product integration is intentionally not faked yet.</div></main></body></html>`;
}

function renderPreview(mission, fixture, buildSha) {
  const rows = mission.assertions.map((assertion) => `<li><strong>${escapeHtml(assertion.type)}</strong> — ${escapeHtml(assertion.text)}</li>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(mission.persona)} mission preview</title><style>:root{font-family:Inter,system-ui,sans-serif;background:#f4f7f5;color:#14231b}*{box-sizing:border-box}body{margin:0}.wrap{width:min(720px,calc(100% - 20px));margin:22px auto}.card{background:#fff;border:1px solid #bdc7c1;border-radius:16px;padding:16px}.k{font-size:.68rem;font-weight:950;color:#08783f}.context{color:#667269}.fixture{background:#f1f4f2;padding:12px;border-radius:10px;overflow-wrap:anywhere;font-size:.75rem}.warning{border-left:4px solid #9a6a00;padding:8px 10px;background:#fff8df;margin:12px 0}.actions{display:flex;gap:8px;flex-wrap:wrap}.actions a{min-height:46px;display:flex;align-items:center;padding:0 14px;border-radius:10px;border:1px solid #08783f;color:#08783f;text-decoration:none;font-weight:900}.actions a:first-child{background:#08783f;color:#fff}li{margin:7px 0;font-size:.82rem}</style></head><body><main class="wrap"><div class="card"><div class="k">${escapeHtml(mission.persona.toUpperCase())} MISSION · FIXTURE PREVIEW</div><h1>You are a ${escapeHtml(mission.persona.toLowerCase())}.</h1><p class="context">${escapeHtml(mission.context)}</p><p><strong>You want to:</strong> ${escapeHtml(mission.action)}</p><div class="warning"><strong>Not a product test yet.</strong> This proves seeded mission generation without pretending the real route/permissions integration is finished.</div><h2>Generated Arrange state</h2><pre class="fixture">${escapeHtml(JSON.stringify(fixture, null, 2))}</pre><h2>Future assertions</h2><ul>${rows}</ul><div class="actions"><a href="/qa/mission/preview?mission=${encodeURIComponent(mission.missionId)}">New randomized preview</a><a href="/qa/mission/preview?mission=${encodeURIComponent(mission.missionId)}&seed=${encodeURIComponent(fixture.seed)}">Replay exact seed</a><a href="/qa">Back to campaign</a></div><p class="k">Seed ${escapeHtml(fixture.seed)} · Build ${escapeHtml(buildSha)}</p></div></main></body></html>`;
}

export function routeQaMissionCampaign(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/qa' && url.pathname !== '/qa/mission/preview') return null;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const buildSha = env.CF_VERSION_METADATA?.id || 'local';
  if (url.pathname === '/qa') return new Response(renderCampaign(buildSha), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

  const missionId = url.searchParams.get('mission');
  const mission = QA_MISSIONS.find((item) => item.missionId === missionId);
  if (!mission) return new Response('Unknown QA mission', { status: 404 });
  if (mission.status !== 'fixture-ready') return new Response('Mission preview is not available for this mission state', { status: 409 });
  const seed = (url.searchParams.get('seed') || newSeed()).slice(0, 64);
  const fixture = buildQaMissionFixture(missionId, seed);
  return new Response(renderPreview(mission, fixture, buildSha), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
