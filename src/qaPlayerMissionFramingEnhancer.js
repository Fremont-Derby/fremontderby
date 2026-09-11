import { activePlayerAvailabilityMission } from './qaPlayerAvailabilityMission.js';
import { activePlayerNextMatchMission } from './qaPlayerNextMatchMission2.js';

const NEXT_MATCH_ID = 'player.find-next-match';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function cookieValue(request, name) {
  for (const pair of String(request?.headers?.get('cookie') || '').split(';')) {
    const item = pair.trim();
    const split = item.indexOf('=');
    if (split > 0 && item.slice(0, split) === name) return decodeURIComponent(item.slice(split + 1));
  }
  return '';
}

function fixtureTeamName(fixture) {
  const team = fixture?.team;
  if (team && typeof team === 'object' && 'name' in team && typeof team.name === 'string') return team.name;
  if (typeof team === 'string') return team;
  return 'your team';
}

function activePlayerMission(request, env) {
  const next = activePlayerNextMatchMission(request, env);
  if (next) {
    return {
      ...next,
      missionId: NEXT_MATCH_ID,
      title: 'Find your next match',
      goal: 'Without leaving Home, identify your soonest match across multiple teams and seasons: season, team, opponent, date, time, and location.',
      finish: 'all six details are obvious on the first Home screen without choosing a team or season first',
      checkHref: '/qa/mission/finish',
    };
  }

  const availability = activePlayerAvailabilityMission(request, env);
  if (!availability) return null;
  return {
    ...availability,
    missionId: 'player.mark-availability',
    title: 'Report your availability',
    goal: `${availability.fixture.situation} Mark yourself ${availability.fixture.targetStatus === 'available' ? 'Available' : 'Unavailable'} for the upcoming league night.`,
    finish: `your ${availability.fixture.targetStatus === 'available' ? 'Available' : 'Unavailable'} choice is visibly saved for ${availability.fixture.nextMatch.date}`,
    checkHref: '/qa/mission/availability-finish',
  };
}

function safeProductPath(value) {
  const path = String(value || '/');
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/qa/')) return '/';
  return path;
}

export function routeQaPlayerMissionFrame(request, env = {}) {
  if (!request || request.method !== 'GET') return null;
  const active = activePlayerMission(request, env);
  if (!active) return null;
  const url = new URL(request.url);
  if (url.pathname !== '/qa/player-mission/play') return null;

  const src = safeProductPath(url.searchParams.get('src'));
  const { fixture } = active;
  const stuck = active.missionId === NEXT_MATCH_ID && cookieValue(request, 'fd_qa_next_match_stuck') === '1';
  const returnTo = src.startsWith('/schedule') ? '/schedule' : '/';
  const stuckControl = active.missionId === NEXT_MATCH_ID
    ? `<a class="qa-stuck" data-qa-stuck href="/qa/mission/stuck?mission=${NEXT_MATCH_ID}&returnTo=${encodeURIComponent(returnTo)}">I’m stuck</a>`
    : '';
  const hint = stuck
    ? '<p class="qa-hint" role="status"><strong>Hint:</strong> The answer should already be visible on Home. If it is not, keep this mission marked FAIL and continue the survey.</p>'
    : '';
  const recoveryScript = active.missionId === NEXT_MATCH_ID
    ? `<script>(()=>{const stuck=document.querySelector('[data-qa-stuck]');if(stuck)stuck.addEventListener('click',()=>{try{localStorage.setItem('fd.qa.mission.${NEXT_MATCH_ID}.${esc(active.seed)}.discoverability','fail')}catch{}})})();</script>`
    : '';

  const identity = active.missionId === NEXT_MATCH_ID
    ? `You are ${esc(fixture.player.name)}. This test gives you multiple teams and multiple active seasons.`
    : `You are ${esc(fixture.player.name)} on ${esc(fixtureTeamName(fixture))}.`;

  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Staged QA Mission · Fremont Derby</title><style>
    :root{font-family:Inter,system-ui,sans-serif;background:#0d1712;color:#fff}*{box-sizing:border-box}html,body{height:100%;margin:0}body{display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden}.qa-head{padding:10px 12px;background:#0d1712;border-bottom:2px solid #53e391;text-align:center}.qa-badge{font-size:.72rem;font-weight:950;letter-spacing:.13em;color:#86f5b4}.qa-head strong{display:block;margin-top:4px;font-size:.95rem}.qa-head p{margin:5px auto 0;max-width:760px;color:#d5e2da;font-size:.78rem;line-height:1.35}.qa-hint{padding:6px 9px;border-radius:8px;background:#fff8df!important;color:#5b4500!important}.qa-frame-wrap{min-height:0;padding:8px;background:#1a241f}.qa-frame{display:block;width:100%;height:100%;border:2px solid #86f5b4;border-radius:12px;background:#fff}.qa-controls{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:9px 12px calc(9px + env(safe-area-inset-bottom));background:#0d1712;border-top:2px solid #53e391}.qa-controls a{min-height:48px;border-radius:11px;display:grid;place-items:center;justify-content:center;text-align:center;padding:8px 12px;font-weight:900;text-decoration:none}.qa-check{background:#08783f;color:#fff}.qa-stuck{background:#fff8df;color:#6a4a00;border:2px solid #b6952f}.qa-abort{background:#fff;color:#7b2020;border:2px solid #cf5555}@media(max-width:520px){.qa-head{padding:6px 8px}.qa-badge{font-size:.64rem}.qa-head strong{font-size:.86rem;margin-top:2px}.qa-head p{font-size:.68rem;line-height:1.25;margin-top:3px}.qa-frame-wrap{padding:5px}.qa-controls{grid-template-columns:1.35fr 1fr 1fr;gap:5px;padding:6px 7px calc(6px + env(safe-area-inset-bottom))}.qa-controls a{min-height:44px;padding:5px 6px;font-size:.72rem}}
  </style></head><body>
    <header class="qa-head">
      <div class="qa-badge" aria-label="STAGED QA MISSION · TEST DATA ONLY">STAGED QA MISSION · TEST DATA ONLY</div>
      <strong>Player mission: ${esc(active.title)}</strong>
      <p>${identity} This staged scenario uses synthetic player, team, and match data; you are not changing real league or team data, and this mission cannot change real league data. Your goal: ${esc(active.goal)} Finish when: ${esc(active.finish)}. Then use Check mission for 4 quick PASS/FAIL questions.</p>
      ${hint}
    </header>
    <main class="qa-frame-wrap"><iframe class="qa-frame" title="Fremont Derby staged interaction" src="${esc(src)}"></iframe></main>
    <footer class="qa-controls" aria-label="Mission controls"><a class="qa-check" data-player-finish href="${active.checkHref}">Check mission</a>${stuckControl}<a class="qa-abort" href="/qa/mission/end">Abort mission</a></footer>
    ${recoveryScript}<script>(()=>{try{const key='fd.qa.persona.started.'+${JSON.stringify(active.missionId)}+'.'+${JSON.stringify(active.seed)};if(!localStorage.getItem(key))localStorage.setItem(key,String(Date.now()))}catch{}})();</script>
  </body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

export async function enhanceQaPlayerMissionFraming(response, request, env = {}) {
  if (!response || request?.method !== 'GET') return response;
  const active = activePlayerMission(request, env);
  if (!active) return response;
  const url = new URL(request.url);
  if (!['/', '/schedule'].includes(url.pathname)) return response;
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;

  let html = await response.text();
  html = html
    .replace(/<aside class="fd-qa-mission"[\s\S]*?<\/aside>/, '')
    .replace(/<aside class="fd-qa-availability"[\s\S]*?<\/aside>/, '');
  const redirect = `<script>(()=>{if(window.top===window.self){const path=location.pathname+location.search;location.replace('/qa/player-mission/play?src='+encodeURIComponent(path))}})();</script>`;
  html = html.replace('</body>', `${redirect}</body>`);

  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
