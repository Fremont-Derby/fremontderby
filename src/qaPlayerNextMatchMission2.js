import { buildQaMissionFixture } from './qaMissionCampaign.js';
import { renderPersonaEvidenceScript } from './qaPersonaEvidenceClient.js';

const MISSION_ID = 'player.find-next-match';
const MISSION_COOKIE = 'fd_qa_mission';
const REACHED_COOKIE = 'fd_qa_mission_reached';

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function cookies(request) {
  const map = new Map();
  for (const pair of String(request?.headers?.get('cookie') || '').split(';')) {
    const item = pair.trim();
    const split = item.indexOf('=');
    if (split > 0) map.set(item.slice(0, split), decodeURIComponent(item.slice(split + 1)));
  }
  return map;
}

function setCookie(name, value, maxAge = 14400) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function cleanSeed(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
}

function newSeed() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID().slice(0, 8);
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function activePlayerNextMatchMission(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl') return null;
  const raw = cookies(request).get(MISSION_COOKIE) || '';
  const prefix = `${MISSION_ID}:`;
  if (!raw.startsWith(prefix)) return null;
  const seed = cleanSeed(raw.slice(prefix.length));
  const fixture = seed ? buildQaMissionFixture(MISSION_ID, seed) : null;
  return fixture ? { seed, fixture } : null;
}

export function buildPlayerNextMatchSchedule(fixture) {
  const { seed, team, nextMatch } = fixture;
  const season = { id: `qa-next-match-${seed}`, name: 'QA Mission League', status: 'active' };
  const rivals = [
    ['Corner Pocket Crew', 'Rail Runners'],
    ['Side Pocket Sharks', 'Hill Hill Bandits'],
  ];
  const matches = [{
    teamMatchId: nextMatch.id,
    teamAId: team.id,
    teamAName: team.name,
    teamBId: nextMatch.opponent.id,
    teamBName: nextMatch.opponent.name,
    scheduledTime: nextMatch.time,
    venueName: nextMatch.venue,
    tableNumber: 2,
    status: 'scheduled',
  }];
  rivals.forEach((names, index) => matches.push({
    teamMatchId: `qa-${seed}-distractor-${index + 1}`,
    teamAId: `qa-${seed}-d${index}a`,
    teamAName: names[0],
    teamBId: `qa-${seed}-d${index}b`,
    teamBName: names[1],
    scheduledTime: nextMatch.time,
    venueName: nextMatch.venue,
    tableNumber: index === 0 ? 1 : 3,
    status: 'scheduled',
  }));
  return {
    season,
    rounds: [{ roundId: `qa-${seed}-round-${nextMatch.roundNumber}`, roundNumber: nextMatch.roundNumber, stage: 'regular', scheduledOn: nextMatch.date, status: 'scheduled', matches }],
  };
}

function checkpointPage(fixture, reached, buildSha) {
  const questions = [
    { id: 'discover-next-match', text: 'I knew where to look for my next match without instructions.' },
    { id: 'identity-clear', text: 'It was obvious which matchup belonged to my team.' },
    { id: 'date-location-clear', text: 'The opponent, date, time, and location were easy to understand.' },
    { id: 'next-night-clear', text: 'I did not have to guess which league night was next.' },
  ];
  const checks = questions.map((question, index) => `<div class="check"><p>${esc(question.text)}</p><div class="choices"><button data-check="${index}" data-value="pass" aria-pressed="false">PASS</button><button data-check="${index}" data-value="fail" aria-pressed="false">FAIL</button></div></div>`).join('');
  const evidenceScript = renderPersonaEvidenceScript({
    missionId: MISSION_ID,
    seed: fixture.seed,
    buildSha,
    assertionIds: questions.map((question) => question.id),
    fixtureFacts: {
      world: 'player',
      mission: 'find-next-match',
      multiple_teams: true,
      multiple_seasons: true,
      target_visible_on_home: true,
    },
    reached,
  });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mission check · Fremont Derby</title><style>:root{font-family:Inter,system-ui,sans-serif;background:#f4f7f5;color:#14231b}*{box-sizing:border-box}body{margin:0}.wrap{width:min(720px,calc(100% - 20px));margin:18px auto 44px}.card{background:#fff;border:1px solid #bdc7c1;border-radius:18px;padding:16px}.k{font-size:.7rem;font-weight:950;letter-spacing:.08em;color:#08783f}.card h1{font-size:1.65rem;margin:5px 0 8px}.target{padding:12px;border-radius:12px;background:#eef5f1;margin:12px 0;font-size:.86rem}.check{border-top:1px solid #e1e5e2;padding-top:10px}.check p{font-weight:800;line-height:1.35}.choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}.choices button,.finish{min-height:48px;border-radius:11px;border:1px solid #08783f;font-weight:900}.choices button{background:#fff;color:#08783f}.choices button[aria-pressed=true][data-value=pass]{background:#08783f;color:#fff}.choices button[aria-pressed=true][data-value=fail]{background:#9b2c2c;border-color:#9b2c2c;color:#fff}.finish{width:100%;margin-top:14px;background:#e8ece9;color:#69716c;border-color:#ccd2ce}.finish:not(:disabled){background:#08783f;color:#fff}.outcome{display:none;margin-top:14px;padding:14px;border-radius:12px;font-weight:900}.outcome[data-show=true]{display:block}.outcome[data-result=pass]{background:#eaf7ef;color:#075f36}.outcome[data-result=fail]{background:#fff0f0;color:#842626}.machine{font-size:.72rem;color:#6b756e;margin-top:12px}.back{display:inline-block;margin-top:14px;color:#08783f;font-weight:800}</style></head><body><main class="wrap"><section class="card"><div class="k">PLAYER MISSION · CHECKPOINT</div><h1>Did the product get you there?</h1><p>You were testing a staged player with multiple teams and seasons.</p><div class="target"><strong>Target match:</strong> ${esc(fixture.team.name)} vs ${esc(fixture.nextMatch.opponent.name)}<br>${esc(fixture.nextMatch.date)} · ${esc(fixture.nextMatch.time)} · ${esc(fixture.nextMatch.venue)}</div>${reached ? '' : '<p><strong>Mission route not completed.</strong> Return to Home before finishing.</p>'}<div data-human-checks>${checks}</div><button class="finish" data-finish disabled>Answer 4 checks to finish</button><div class="outcome" data-outcome role="status" aria-live="polite"></div><div class="machine">Your result is saved centrally when possible. If the network is unavailable, it is queued on this device and retried later.</div>${reached ? '' : '<a class="back" href="/">Return to mission</a>'}</section></main>${evidenceScript}</body></html>`;
}

export function routeQaPlayerNextMatchMission(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl' || !request) return null;
  const url = new URL(request.url);
  if (url.pathname === '/qa/mission/start') {
    if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    if (url.searchParams.get('mission') !== MISSION_ID) return null;
    const seed = cleanSeed(url.searchParams.get('seed')) || newSeed();
    const headers = new Headers({ location: '/', 'cache-control': 'no-store' });
    headers.append('set-cookie', setCookie(MISSION_COOKIE, `${MISSION_ID}:${seed}`));
    headers.append('set-cookie', setCookie(REACHED_COOKIE, '', 0));
    return new Response(null, { status: 302, headers });
  }
  if (url.pathname === '/qa/mission/end') {
    const headers = new Headers({ location: '/qa', 'cache-control': 'no-store' });
    headers.append('set-cookie', setCookie(MISSION_COOKIE, '', 0));
    headers.append('set-cookie', setCookie(REACHED_COOKIE, '', 0));
    return new Response(null, { status: 302, headers });
  }

  const active = activePlayerNextMatchMission(request, env);
  if (!active) return null;
  const { fixture } = active;
  const schedule = buildPlayerNextMatchSchedule(fixture);

  if (request.method === 'GET' && url.pathname === '/api/seasons') return Response.json({ seasons: [schedule.season] }, { headers: { 'cache-control': 'no-store' } });
  if (request.method === 'GET' && url.pathname === `/api/seasons/${schedule.season.id}/schedule`) return Response.json({ season: schedule.season, rounds: schedule.rounds }, { headers: { 'cache-control': 'no-store' } });
  if (request.method === 'GET' && url.pathname === '/api/me/teams') return Response.json({ teamManagement: { availability_contexts: [{ teamId: fixture.team.id, teamName: fixture.team.name }], captain_teams: [] } }, { headers: { 'cache-control': 'no-store' } });
  if (request.method === 'GET' && url.pathname === '/qa/mission/finish') {
    const reached = cookies(request).get(REACHED_COOKIE) === fixture.seed;
    const buildSha = env.CF_VERSION_METADATA?.tag || env.CF_VERSION_METADATA?.id || 'local';
    return new Response(checkpointPage(fixture, reached, buildSha), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
  return null;
}

export async function enhanceQaPlayerNextMatchMission(response, request, env = {}) {
  const active = activePlayerNextMatchMission(request, env);
  if (!response || !active || request.method !== 'GET') return response;
  const url = new URL(request.url);
  if (!['/', '/schedule'].includes(url.pathname)) return response;
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;

  const { fixture } = active;
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  if (url.pathname === '/schedule') headers.append('set-cookie', setCookie(REACHED_COOKIE, fixture.seed));
  const action = url.pathname === '/schedule' ? '<a class="fd-qa-mission__finish" href="/qa/mission/finish">I found my match</a>' : '<span class="fd-qa-mission__hint">Use Fremont Derby normally. No route hints.</span>';
  const hud = `<aside class="fd-qa-mission" aria-label="QA mission"><div class="fd-qa-mission__k">PLAYER MISSION</div><div class="fd-qa-mission__who">You are <strong>${esc(fixture.player.name)}</strong> on <strong>${esc(fixture.team.name)}</strong>.</div><div class="fd-qa-mission__goal"><strong>Your goal:</strong> Find when and where you play next, and who your team faces.</div>${action}<a class="fd-qa-mission__quit" href="/qa/mission/end">Quit</a></aside>`;
  const styles = '<style>.fd-qa-mission{box-sizing:border-box;width:min(100% - 24px,920px);margin:14px auto 0;padding:13px 14px;border:2px solid #08783f;border-radius:14px;background:#f3fbf6;color:#14231b;font-family:Inter,system-ui,sans-serif}.fd-qa-mission__k{font-size:.68rem;font-weight:950;letter-spacing:.08em;color:#08783f}.fd-qa-mission__who,.fd-qa-mission__goal{margin-top:5px;line-height:1.35}.fd-qa-mission__goal{font-size:.88rem}.fd-qa-mission__who{font-size:.78rem;color:#4e5d54}.fd-qa-mission__hint{display:inline-block;margin-top:9px;font-size:.72rem;color:#657169}.fd-qa-mission__finish{display:inline-flex;min-height:44px;align-items:center;justify-content:center;margin-top:10px;padding:0 14px;border-radius:10px;background:#08783f;color:#fff!important;font-weight:900;text-decoration:none}.fd-qa-mission__quit{display:inline-flex;min-height:44px;align-items:center;margin:8px 0 0 10px;color:#667269!important;font-size:.75rem;font-weight:800;text-decoration:underline}@media(max-width:560px){.fd-qa-mission{width:calc(100% - 16px);margin-top:8px}.fd-qa-mission__finish{width:100%}.fd-qa-mission__quit{margin-left:0;width:100%;justify-content:center}}</style>';
  const html = await response.text();
  const enhanced = html.replace('</head>', `${styles}</head>`).replace(/<body([^>]*)>/, `<body$1>${hud}`);
  return new Response(enhanced, { status: response.status, statusText: response.statusText, headers });
}
