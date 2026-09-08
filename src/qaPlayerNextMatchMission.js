import { buildQaMissionFixture } from './qaMissionCampaign.js';

const MISSION_ID = 'player.find-next-match';
const MISSION_COOKIE = 'fd_qa_mission';
const REACHED_COOKIE = 'fd_qa_mission_reached';
const SEASON_ID_PREFIX = 'qa-next-match-';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function cookieMap(request) {
  const values = new Map();
  for (const pair of String(request?.headers?.get('cookie') || '').split(';')) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const index = trimmed.indexOf('=');
    if (index < 0) continue;
    values.set(trimmed.slice(0, index), decodeURIComponent(trimmed.slice(index + 1)));
  }
  return values;
}

function missionCookie(seed) {
  return `${MISSION_COOKIE}=${encodeURIComponent(`${MISSION_ID}:${seed}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=14400`;
}

function reachedCookie(seed) {
  return `${REACHED_COOKIE}=${encodeURIComponent(seed)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=14400`;
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function randomSeed() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID().slice(0, 8);
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function cleanSeed(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
}

export function activePlayerNextMatchMission(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl' || !request) return null;
  const raw = cookieMap(request).get(MISSION_COOKIE) || '';
  const prefix = `${MISSION_ID}:`;
  if (!raw.startsWith(prefix)) return null;
  const seed = cleanSeed(raw.slice(prefix.length));
  if (!seed) return null;
  const fixture = buildQaMissionFixture(MISSION_ID, seed);
  return fixture ? { seed, fixture } : null;
}

function seasonId(seed) {
  return `${SEASON_ID_PREFIX}${seed}`;
}

function otherTeam(seed, suffix, name) {
  return { id: `qa-${seed}-${suffix}`, name };
}

export function buildPlayerNextMatchSchedule(fixture) {
  const { seed, team, nextMatch } = fixture;
  const season = {
    id: seasonId(seed),
    name: 'QA Mission League',
    status: 'active',
  };
  const distractorA = otherTeam(seed, 'distractor-a', 'Corner Pocket Crew');
  const distractorB = otherTeam(seed, 'distractor-b', 'Rail Runners');
  const distractorC = otherTeam(seed, 'distractor-c', 'Side Pocket Sharks');
  const distractorD = otherTeam(seed, 'distractor-d', 'Hill Hill Bandits');
  const round = {
    roundId: `qa-${seed}-round-${nextMatch.roundNumber}`,
    roundNumber: nextMatch.roundNumber,
    stage: 'regular',
    scheduledOn: nextMatch.date,
    status: 'scheduled',
    matches: [
      {
        teamMatchId: nextMatch.id,
        teamAId: team.id,
        teamAName: team.name,
        teamBId: nextMatch.opponent.id,
        teamBName: nextMatch.opponent.name,
        scheduledTime: nextMatch.time,
        venueName: nextMatch.venue,
        tableNumber: 2,
        status: 'scheduled',
      },
      {
        teamMatchId: `qa-${seed}-distractor-1`,
        teamAId: distractorA.id,
        teamAName: distractorA.name,
        teamBId: distractorB.id,
        teamBName: distractorB.name,
        scheduledTime: nextMatch.time,
        venueName: nextMatch.venue,
        tableNumber: 1,
        status: 'scheduled',
      },
      {
        teamMatchId: `qa-${seed}-distractor-2`,
        teamAId: distractorC.id,
        teamAName: distractorC.name,
        teamBId: distractorD.id,
        teamBName: distractorD.name,
        scheduledTime: nextMatch.time,
        venueName: nextMatch.venue,
        tableNumber: 3,
        status: 'scheduled',
      },
    ],
  };
  return { season, rounds: [round] };
}

function resultPage(fixture, reached) {
  const replay = `/qa/mission/start?mission=${encodeURIComponent(MISSION_ID)}&seed=${encodeURIComponent(fixture.seed)}`;
  const fresh = `/qa/mission/start?mission=${encodeURIComponent(MISSION_ID)}`;
  const target = `${fixture.team.name} vs ${fixture.nextMatch.opponent.name}`;
  const machineState = reached ? 'passed' : 'failed';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mission check · Fremont Derby</title><style>
    :root{font-family:Inter,system-ui,sans-serif;background:#f4f7f5;color:#14231b}*{box-sizing:border-box}body{margin:0}.wrap{width:min(720px,calc(100% - 20px));margin:18px auto 44px}.card{background:#fff;border:1px solid #bdc7c1;border-radius:18px;padding:16px}.k{font-size:.7rem;font-weight:950;letter-spacing:.08em;color:#08783f}.card h1{font-size:1.65rem;margin:5px 0 8px}.target{padding:12px;border-radius:12px;background:#eef5f1;margin:12px 0;font-size:.86rem}.checks{display:grid;gap:10px;margin-top:16px}.check{border-top:1px solid #e1e5e2;padding-top:10px}.check p{font-weight:800;line-height:1.35}.choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}.choices button,.actions a,.finish{min-height:48px;border-radius:11px;border:1px solid #08783f;font-weight:900}.choices button{background:#fff;color:#08783f}.choices button[aria-pressed=true][data-value=pass]{background:#08783f;color:#fff}.choices button[aria-pressed=true][data-value=fail]{background:#9b2c2c;border-color:#9b2c2c;color:#fff}.finish{width:100%;margin-top:14px;background:#e8ece9;color:#69716c;border-color:#ccd2ce}.finish:not(:disabled){background:#08783f;color:#fff}.outcome{display:none;margin-top:14px;padding:14px;border-radius:12px;font-weight:900}.outcome[data-show=true]{display:block}.outcome[data-result=pass]{background:#eaf7ef;color:#075f36}.outcome[data-result=fail]{background:#fff0f0;color:#842626}.actions{display:none;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.actions[data-show=true]{display:grid}.actions a{display:grid;place-items:center;text-decoration:none;color:#08783f;background:#fff;padding:8px}.actions a:first-child{background:#08783f;color:#fff}.machine{font-size:.72rem;color:#6b756e;margin-top:12px}.back{display:inline-block;margin-top:14px;color:#08783f;font-weight:800}@media(max-width:540px){.actions{grid-template-columns:1fr}}</style></head><body><main class="wrap"><section class="card"><div class="k">PLAYER MISSION · CHECKPOINT</div><h1>Did the product get you there?</h1><p>You were <strong>${escapeHtml(fixture.player.name)}</strong> on <strong>${escapeHtml(fixture.team.name)}</strong>.</p><div class="target"><strong>Target match:</strong> ${escapeHtml(target)}<br>${escapeHtml(fixture.nextMatch.date)} · ${escapeHtml(fixture.nextMatch.time)} · ${escapeHtml(fixture.nextMatch.venue)}</div>${reached ? '' : '<p><strong>Mission route not completed.</strong> Return to the product and find the schedule before finishing.</p>'}<div class="checks" data-human-checks>
    <div class="check"><p>I knew where to look for my next match without instructions.</p><div class="choices"><button data-check="0" data-value="pass" aria-pressed="false">PASS</button><button data-check="0" data-value="fail" aria-pressed="false">FAIL</button></div></div>
    <div class="check"><p>It was obvious which matchup belonged to my team.</p><div class="choices"><button data-check="1" data-value="pass" aria-pressed="false">PASS</button><button data-check="1" data-value="fail" aria-pressed="false">FAIL</button></div></div>
    <div class="check"><p>The opponent, date, time, and location were easy to understand.</p><div class="choices"><button data-check="2" data-value="pass" aria-pressed="false">PASS</button><button data-check="2" data-value="fail" aria-pressed="false">FAIL</button></div></div>
    <div class="check"><p>I did not have to guess which league night was next.</p><div class="choices"><button data-check="3" data-value="pass" aria-pressed="false">PASS</button><button data-check="3" data-value="fail" aria-pressed="false">FAIL</button></div></div>
    </div><button class="finish" data-finish disabled>Answer 4 checks to finish</button><div class="outcome" data-outcome></div><div class="actions" data-actions><a href="${replay}">Replay exact mission</a><a href="${fresh}">Play with new data</a><a href="/qa">Back to missions</a><a href="/qa/mission/end">End mission</a></div><div class="machine">Product route check: ${machineState}. Machine checks stay in the background during play.</div>${reached ? '' : '<a class="back" href="/">Return to mission</a>'}</section></main><script>(()=>{const buttons=[...document.querySelectorAll('[data-check]')],finish=document.querySelector('[data-finish]'),outcome=document.querySelector('[data-outcome]'),actions=document.querySelector('[data-actions]'),total=4,reached=${reached ? 'true' : 'false'};function selected(index){return buttons.find(b=>b.dataset.check===String(index)&&b.getAttribute('aria-pressed')==='true')}function sync(){const answers=Array.from({length:total},(_,i)=>selected(i));const remaining=answers.filter(v=>!v).length;finish.disabled=!reached||remaining>0;finish.textContent=!reached?'Return to the product first':remaining?`Answer ${remaining} check${remaining===1?'':'s'} to finish`:'Finish mission'}for(const button of buttons)button.addEventListener('click',()=>{for(const peer of buttons.filter(b=>b.dataset.check===button.dataset.check))peer.setAttribute('aria-pressed',String(peer===button));sync()});finish.addEventListener('click',()=>{const failed=Array.from({length:total},(_,i)=>selected(i)?.dataset.value).some(v=>v==='fail');const result=failed?'fail':'pass';outcome.dataset.show='true';outcome.dataset.result=result;outcome.textContent=result==='pass'?'MISSION PASSED ✓':'MISSION FAILED — your feedback is a valid result.';actions.dataset.show='true';finish.disabled=true;finish.textContent='Result saved';try{localStorage.setItem('fd.qa.mission.${MISSION_ID}.${escapeHtml(fixture.seed)}',JSON.stringify({missionId:'${MISSION_ID}',seed:'${escapeHtml(fixture.seed)}',result,answers:Array.from({length:total},(_,i)=>selected(i)?.dataset.value||null),savedAt:new Date().toISOString()}))}catch{}outcome.scrollIntoView({block:'nearest',behavior:'smooth'})});sync()})();</script></body></html>`;
}

export function routeQaPlayerNextMatchMission(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl' || !request) return null;
  const url = new URL(request.url);
  const mission = activePlayerNextMatchMission(request, env);

  if (url.pathname === '/qa/mission/start') {
    if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    if (url.searchParams.get('mission') !== MISSION_ID) return null;
    const seed = cleanSeed(url.searchParams.get('seed')) || randomSeed();
    const headers = new Headers({ location: '/', 'cache-control': 'no-store' });
    headers.append('set-cookie', missionCookie(seed));
    headers.append('set-cookie', clearCookie(REACHED_COOKIE));
    return new Response(null, { status: 302, headers });
  }

  if (url.pathname === '/qa/mission/end') {
    const headers = new Headers({ location: '/qa', 'cache-control': 'no-store' });
    headers.append('set-cookie', clearCookie(MISSION_COOKIE));
    headers.append('set-cookie', clearCookie(REACHED_COOKIE));
    return new Response(null, { status: 302, headers });
  }

  if (!mission) return null;
  const { fixture } = mission;
  const schedule = buildPlayerNextMatchSchedule(fixture);

  if (request.method === 'GET' && url.pathname === '/api/seasons') {
    return Response.json({ seasons: [schedule.season] }, { headers: { 'cache-control': 'no-store' } });
  }
  if (request.method === 'GET' && url.pathname === `/api/seasons/${encodeURIComponent(schedule.season.id)}/schedule`) {
    return Response.json({ season: schedule.season, rounds: schedule.rounds }, { headers: { 'cache-control': 'no-store' } });
  }
  if (request.method === 'GET' && url.pathname === '/api/me/teams') {
    return Response.json({ teamManagement: { availability_contexts: [{ teamId: fixture.team.id, teamName: fixture.team.name }], captain_teams: [] } }, { headers: { 'cache-control': 'no-store' } });
  }
  if (request.method === 'GET' && url.pathname === '/qa/mission/finish') {
    const reached = cookieMap(request).get(REACHED_COOKIE) === fixture.seed;
    return new Response(resultPage(fixture, reached), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
  return null;
}

export async function enhanceQaPlayerNextMatchMission(response, request, env = {}) {
  const mission = activePlayerNextMatchMission(request, env);
  if (!response || !mission || request.method !== 'GET') return response;
  const url = new URL(request.url);
  if (!['/', '/schedule'].includes(url.pathname)) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const { fixture } = mission;
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  if (url.pathname === '/schedule') headers.append('set-cookie', reachedCookie(fixture.seed));
  const html = await response.text();
  const action = url.pathname === '/schedule'
    ? '<a class="fd-qa-mission__finish" href="/qa/mission/finish">I found my match</a>'
    : '<span class="fd-qa-mission__hint">Use Fremont Derby normally. No route hints.</span>';
  const hud = `<aside class="fd-qa-mission" aria-label="QA mission"><div class="fd-qa-mission__k">PLAYER MISSION</div><div class="fd-qa-mission__who">You are <strong>${escapeHtml(fixture.player.name)}</strong> on <strong>${escapeHtml(fixture.team.name)}</strong>.</div><div class="fd-qa-mission__goal"><strong>Your goal:</strong> Find when and where you play next, and who your team faces.</div>${action}<a class="fd-qa-mission__quit" href="/qa/mission/end">Quit</a></aside>`;
  const styles = `<style>.fd-qa-mission{box-sizing:border-box;width:min(100% - 24px,920px);margin:14px auto 0;padding:13px 14px;border:2px solid #08783f;border-radius:14px;background:#f3fbf6;color:#14231b;font-family:Inter,system-ui,sans-serif}.fd-qa-mission__k{font-size:.68rem;font-weight:950;letter-spacing:.08em;color:#08783f}.fd-qa-mission__who,.fd-qa-mission__goal{margin-top:5px;line-height:1.35}.fd-qa-mission__goal{font-size:.88rem}.fd-qa-mission__who{font-size:.78rem;color:#4e5d54}.fd-qa-mission__hint{display:inline-block;margin-top:9px;font-size:.72rem;color:#657169}.fd-qa-mission__finish{display:inline-flex;min-height:44px;align-items:center;justify-content:center;margin-top:10px;padding:0 14px;border-radius:10px;background:#08783f;color:#fff!important;font-weight:900;text-decoration:none}.fd-qa-mission__quit{display:inline-flex;min-height:44px;align-items:center;margin:8px 0 0 10px;color:#667269!important;font-size:.75rem;font-weight:800;text-decoration:underline}@media(max-width:560px){.fd-qa-mission{width:calc(100% - 16px);margin-top:8px}.fd-qa-mission__finish{width:100%}.fd-qa-mission__quit{margin-left:0;width:100%;justify-content:center}}</style>`;
  const enhanced = html.replace('</head>', `${styles}</head>`).replace(/<body([^>]*)>/, `<body$1>${hud}`);
  return new Response(enhanced, { status: response.status, statusText: response.statusText, headers });
}
