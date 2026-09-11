import { buildQaMissionFixture } from './qaMissionCampaign.js';
import { buildPlayerNextMatchSchedule } from './qaPlayerNextMatchMission.js';
import { renderPersonaEvidenceScript } from './qaPersonaEvidenceClient.js';

const MISSION_ID = 'player.mark-availability';
const MISSION_COOKIE = 'fd_qa_mission';
const STATE_COOKIE = 'fd_qa_availability_state';

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function cookieMap(request) {
  const values = new Map();
  for (const pair of String(request?.headers?.get('cookie') || '').split(';')) {
    const item = pair.trim();
    const split = item.indexOf('=');
    if (split > 0) values.set(item.slice(0, split), decodeURIComponent(item.slice(split + 1)));
  }
  return values;
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

function hashSeed(seed) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function buildPlayerAvailabilityFixture(seed) {
  const base = buildQaMissionFixture('player.find-next-match', seed);
  const variant = hashSeed(seed) % 3;
  const startingStatus = variant === 2 ? 'available' : 'unsure';
  const targetStatus = variant === 0 ? 'available' : 'unavailable';
  const situation = variant === 0
    ? 'You can make the upcoming league night.'
    : variant === 1
      ? 'You cannot make the upcoming league night.'
      : 'Your plans changed and you can no longer make the upcoming league night.';
  return {
    ...base,
    missionId: MISSION_ID,
    startingStatus,
    targetStatus,
    situation,
    semantic: {
      upcomingMatchExists: true,
      playerCanEditOnlyOwnAvailability: true,
      unrelatedAvailabilityUnchanged: true,
    },
  };
}

export function activePlayerAvailabilityMission(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl') return null;
  const raw = cookieMap(request).get(MISSION_COOKIE) || '';
  const prefix = `${MISSION_ID}:`;
  if (!raw.startsWith(prefix)) return null;
  const seed = cleanSeed(raw.slice(prefix.length));
  if (!seed) return null;
  return { seed, fixture: buildPlayerAvailabilityFixture(seed) };
}

function currentStatus(request, fixture) {
  const saved = cookieMap(request).get(STATE_COOKIE);
  return ['available', 'unsure', 'unavailable'].includes(saved) ? saved : fixture.startingStatus;
}

function availabilityResponse(fixture, status) {
  return {
    availability: {
      season_id: `qa-next-match-${fixture.seed}`,
      availability_date: fixture.nextMatch.date,
      availability_status: status,
      registered: true,
      player_id: fixture.player.id,
    },
  };
}

function checkpointPage(fixture, completed, buildSha) {
  const questions = [
    { id:'discover-availability', text:'I knew where to report my availability without being told which page to open.' },
    { id:'league-night-clear', text:'I knew which league night I was answering for.' },
    { id:'state-clear', text:'The selected availability state was unmistakable.' },
    { id:'persist-clear', text:'After changing it, I trusted that the saved state would persist.' },
  ];
  const checks=questions.map((question,index)=>`<div class="check"><p>${esc(question.text)}</p><div class="choices"><button data-check="${index}" data-value="pass" aria-pressed="false">PASS</button><button data-check="${index}" data-value="fail" aria-pressed="false">FAIL</button></div></div>`).join('');
  const evidenceScript=renderPersonaEvidenceScript({
    missionId:MISSION_ID,seed:fixture.seed,buildSha,
    assertionIds:questions.map(question=>question.id),
    fixtureFacts:{world:'player',mission:'mark-availability',target_status:fixture.targetStatus,starting_status:fixture.startingStatus},
    reached:completed,
  });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mission check · Fremont Derby</title><style>:root{font-family:Inter,system-ui,sans-serif;background:#f4f7f5;color:#14231b}*{box-sizing:border-box}body{margin:0}.wrap{width:min(720px,calc(100% - 20px));margin:18px auto 44px}.card{background:#fff;border:1px solid #bdc7c1;border-radius:18px;padding:16px}.k{font-size:.7rem;font-weight:950;letter-spacing:.08em;color:#08783f}.card h1{font-size:1.65rem;margin:5px 0 8px}.goal{padding:12px;border-radius:12px;background:#eef5f1;margin:12px 0;font-size:.86rem}.check{border-top:1px solid #e1e5e2;padding-top:10px}.check p{font-weight:800;line-height:1.35}.choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}.choices button,.finish{min-height:48px;border-radius:11px;border:1px solid #08783f;font-weight:900}.choices button{background:#fff;color:#08783f}.choices button[aria-pressed=true][data-value=pass]{background:#08783f;color:#fff}.choices button[aria-pressed=true][data-value=fail]{background:#9b2c2c;border-color:#9b2c2c;color:#fff}.finish{width:100%;margin-top:14px;background:#e8ece9;color:#69716c;border-color:#ccd2ce}.finish:not(:disabled){background:#08783f;color:#fff}.outcome{display:none;margin-top:14px;padding:14px;border-radius:12px;font-weight:900}.outcome[data-show=true]{display:block}.outcome[data-result=pass]{background:#eaf7ef;color:#075f36}.outcome[data-result=fail]{background:#fff0f0;color:#842626}.machine{font-size:.72rem;color:#6b756e;margin-top:12px}.back{display:inline-block;margin-top:14px;color:#08783f;font-weight:800}</style></head><body><main class="wrap"><section class="card"><div class="k">PLAYER MISSION · CHECKPOINT</div><h1>Did your availability update make sense?</h1><div class="goal"><strong>Goal state:</strong> ${esc(fixture.targetStatus==='available'?'Available':'Unavailable')} for ${esc(fixture.nextMatch.date)}.</div>${completed?'':'<p><strong>The mission goal is not complete yet.</strong> Return to the product and save the requested availability state.</p>'}<div>${checks}</div><button class="finish" data-finish disabled>Answer 4 checks to finish</button><div class="outcome" data-outcome role="status" aria-live="polite"></div><div class="machine">Your result is saved centrally when possible. If the network is unavailable, it is queued on this device and retried later.</div>${completed?'':'<a class="back" href="/">Return to mission</a>'}</section></main>${evidenceScript}</body></html>`;
}

export function routeQaPlayerAvailabilityMission(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl' || !request) return null;
  const url = new URL(request.url);
  if (url.pathname === '/qa/mission/start') {
    if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    if (url.searchParams.get('mission') !== MISSION_ID) return null;
    const seed = cleanSeed(url.searchParams.get('seed')) || newSeed();
    const headers = new Headers({ location: '/', 'cache-control': 'no-store' });
    headers.append('set-cookie', setCookie(MISSION_COOKIE, `${MISSION_ID}:${seed}`));
    headers.append('set-cookie', setCookie(STATE_COOKIE, '', 0));
    return new Response(null, { status: 302, headers });
  }

  const active = activePlayerAvailabilityMission(request, env);
  if (!active) return null;
  const { fixture } = active;
  const schedule = buildPlayerNextMatchSchedule(fixture);

  if (request.method === 'GET' && url.pathname === '/api/seasons') return Response.json({ seasons: [schedule.season] }, { headers: { 'cache-control': 'no-store' } });
  if (request.method === 'GET' && url.pathname === `/api/seasons/${schedule.season.id}/schedule`) return Response.json({ season: schedule.season, rounds: schedule.rounds }, { headers: { 'cache-control': 'no-store' } });

  const availabilityPath = `/api/seasons/${schedule.season.id}/availability/me`;
  if (url.pathname === availabilityPath && request.method === 'GET') {
    if (url.searchParams.get('date') !== fixture.nextMatch.date) return Response.json({ error: 'Unknown mission league date' }, { status: 409 });
    return Response.json(availabilityResponse(fixture, currentStatus(request, fixture)), { headers: { 'cache-control': 'no-store' } });
  }
  if (url.pathname === availabilityPath && request.method === 'PUT') {
    return request.json().catch(() => ({})).then((body) => {
      const status = String(body.status || body.availabilityStatus || '').toLowerCase();
      if (!['available', 'unsure', 'unavailable'].includes(status)) return Response.json({ error: 'Choose a valid availability state' }, { status: 400 });
      if (String(body.date || body.availabilityDate || '') !== fixture.nextMatch.date) return Response.json({ error: 'Unknown mission league date' }, { status: 409 });
      return Response.json(availabilityResponse(fixture, status), { headers: { 'cache-control': 'no-store', 'set-cookie': setCookie(STATE_COOKIE, status) } });
    });
  }
  if (request.method === 'GET' && url.pathname === '/qa/mission/availability-finish') {
    const completed = currentStatus(request, fixture) === fixture.targetStatus;
    const buildSha=env.CF_VERSION_METADATA?.tag || env.CF_VERSION_METADATA?.id || 'local';
    return new Response(checkpointPage(fixture, completed, buildSha), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
  return null;
}

export async function enhanceQaPlayerAvailabilityMission(response, request, env = {}) {
  const active = activePlayerAvailabilityMission(request, env);
  if (!response || !active || request.method !== 'GET') return response;
  const url = new URL(request.url);
  if (!['/', '/schedule'].includes(url.pathname)) return response;
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;

  const { fixture } = active;
  const hudAction = url.pathname === '/schedule'
    ? '<a class="fd-qa-availability__finish" data-qa-availability-finish href="/qa/mission/availability-finish" hidden>Check mission</a>'
    : '<span class="fd-qa-availability__hint">Use Fremont Derby normally. No route hints.</span>';
  const hud = `<aside class="fd-qa-availability" aria-label="QA mission"><div class="fd-qa-availability__k">PLAYER MISSION</div><div class="fd-qa-availability__who">You are <strong>${esc(fixture.player.name)}</strong> on <strong>${esc(fixture.team.name)}</strong>.</div><div class="fd-qa-availability__goal"><strong>Your situation:</strong> ${esc(fixture.situation)} <strong>Your goal:</strong> Mark yourself ${fixture.targetStatus === 'available' ? 'Available' : 'Unavailable'} for the upcoming league night.</div>${hudAction}<a class="fd-qa-availability__quit" href="/qa/mission/end">Quit</a></aside>`;
  const styles = '<style>.fd-qa-availability{box-sizing:border-box;width:min(100% - 24px,920px);margin:14px auto 0;padding:13px 14px;border:2px solid #08783f;border-radius:14px;background:#f3fbf6;color:#14231b;font-family:Inter,system-ui,sans-serif}.fd-qa-availability__k{font-size:.68rem;font-weight:950;letter-spacing:.08em;color:#08783f}.fd-qa-availability__who,.fd-qa-availability__goal{margin-top:5px;line-height:1.35}.fd-qa-availability__who{font-size:.78rem;color:#4e5d54}.fd-qa-availability__goal{font-size:.88rem}.fd-qa-availability__hint{display:inline-block;margin-top:9px;font-size:.72rem;color:#657169}.fd-qa-availability__finish{display:inline-flex;min-height:44px;align-items:center;justify-content:center;margin-top:10px;padding:0 14px;border-radius:10px;background:#08783f;color:#fff!important;font-weight:900;text-decoration:none}.fd-qa-availability__finish[hidden]{display:none}.fd-qa-availability__quit{display:inline-flex;min-height:44px;align-items:center;margin:8px 0 0 10px;color:#667269!important;font-size:.75rem;font-weight:800;text-decoration:underline}@media(max-width:560px){.fd-qa-availability{width:calc(100% - 16px);margin-top:8px}.fd-qa-availability__finish{width:100%}.fd-qa-availability__quit{margin-left:0;width:100%;justify-content:center}}</style>';
  let html = await response.text();
  html = html.replace('</head>', `${styles}</head>`).replace(/<body([^>]*)>/, `<body$1>${hud}`);

  if (url.pathname === '/schedule') {
    html = html.replace("function token(){return sessionStorage.getItem('fd.accessToken')||''}", "function token(){return 'qa-mission'}");
    const observer = `<script>(()=>{const target='${fixture.targetStatus}';const finish=document.querySelector('[data-qa-availability-finish]');const section=document.querySelector('[data-date-availability]');if(!finish||!section)return;function sync(){const selected=section.querySelector('[data-availability-value="'+target+'"][aria-pressed="true"]');const saved=section.querySelector('[data-availability-message]')?.dataset.tone==='ok';finish.hidden=!(selected&&saved)}new MutationObserver(sync).observe(section,{subtree:true,attributes:true,childList:true,characterData:true});sync()})();</script>`;
    html = html.replace('</body>', `${observer}</body>`);
  }
  const headers = new Headers(response.headers); headers.set('cache-control', 'no-store');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
