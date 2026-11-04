import { activePlayerNextMatchMission } from './qaPlayerNextMatchMission2.js';

const MISSION_ID = 'player.find-next-match';
const STUCK_COOKIE = 'fd_qa_next_match_stuck';

function cookieMap(request) {
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

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeReturnTo(value) {
  return value === '/schedule' ? '/schedule' : '/';
}

export function routeQaNextMatchRecovery(request, env = {}) {
  if (!request || env.ENVIRONMENT !== 'jfl') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/qa/mission/stuck' || url.searchParams.get('mission') !== MISSION_ID) return null;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  if (!activePlayerNextMatchMission(request, env)) return new Response(null, { status: 302, headers: { location: '/qa', 'cache-control': 'no-store' } });

  const headers = new Headers({ location: safeReturnTo(url.searchParams.get('returnTo')), 'cache-control': 'no-store' });
  headers.append('set-cookie', setCookie(STUCK_COOKIE, '1'));
  return new Response(null, { status: 302, headers });
}

function resetStuckCookie(response, request) {
  const url = new URL(request.url);
  const isStart = url.pathname === '/qa/mission/start' && url.searchParams.get('mission') === MISSION_ID;
  const isEnd = url.pathname === '/qa/mission/end';
  if (!isStart && !isEnd) return response;
  const headers = new Headers(response.headers);
  headers.append('set-cookie', setCookie(STUCK_COOKIE, '', 0));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function enhanceCheckpoint(html, stuck) {
  if (!stuck || !html.includes('PLAYER MISSION · CHECKPOINT')) return html;
  const failButton = '<button data-check="0" data-value="fail" aria-pressed="true">FAIL</button>';
  const passButton = '<button data-check="0" data-value="pass" aria-pressed="false">PASS</button>';
  let updated = html
    .replace('<button data-check="0" data-value="pass" aria-pressed="false">PASS</button><button data-check="0" data-value="fail" aria-pressed="false">FAIL</button>', `${passButton}${failButton}`)
    .replace('<div data-human-checks>', '<p class="stuck-note"><strong>Discoverability already recorded as FAIL.</strong> You used “I’m stuck” during the mission. Finish the remaining checks normally.</p><div data-human-checks>');
  updated = updated.replace('</style>', '.stuck-note{padding:11px 12px;border-radius:10px;background:#fff4dc;color:#6a4a00;font-size:.82rem;line-height:1.4}</style>');
  return updated;
}

function enhanceProductHtml(html, fixture, pathname, stuck) {
  if (!html.includes('fd-qa-mission')) return html;
  const returnTo = pathname === '/schedule' ? '/schedule' : '/';
  const stuckLink = `<a class="fd-qa-mission__stuck" href="/qa/mission/stuck?mission=${MISSION_ID}&returnTo=${encodeURIComponent(returnTo)}" data-qa-stuck>I’m stuck</a>`;
  const hint = stuck
    ? '<div class="fd-qa-mission__recovery" role="status"><strong>Hint:</strong> Look for where league nights and matchups are listed. You can keep testing the rest of the mission.</div>'
    : '';
  const exactGoal = `<div class="fd-qa-mission__goal"><strong>Your goal:</strong> Find the next scheduled league match for <strong>${esc(fixture.team.name)}</strong>. Identify the opponent, date, time, and location.</div>`;

  let updated = html.replace(/<div class="fd-qa-mission__goal">[\s\S]*?<\/div>/, exactGoal);
  updated = updated.replace('<a class="fd-qa-mission__quit"', `${stuckLink}${hint}<a class="fd-qa-mission__quit"`);
  updated = updated.replace('</style>', '.fd-qa-mission__stuck{display:inline-flex;min-height:44px;align-items:center;justify-content:center;margin:8px 0 0 10px;padding:0 12px;border:1px solid #8b6b15;border-radius:10px;background:#fff8df;color:#6a4a00!important;font-size:.78rem;font-weight:900;text-decoration:none}.fd-qa-mission__recovery{margin-top:9px;padding:10px 11px;border-radius:10px;background:#fff8df;color:#5b4500;font-size:.78rem;line-height:1.4}@media(max-width:560px){.fd-qa-mission__stuck{margin-left:0;width:100%}}</style>');
  updated = updated.replace('</body>', `<script>(()=>{const stuck=document.querySelector('[data-qa-stuck]');if(stuck)stuck.addEventListener('click',()=>{try{localStorage.setItem('fd.qa.mission.${MISSION_ID}.${esc(fixture.seed)}.discoverability','fail')}catch{}})})();</script></body>`);
  return updated;
}

export async function enhanceQaNextMatchRecovery(response, request, env = {}) {
  if (!response || !request || env.ENVIRONMENT !== 'jfl') return response;
  const reset = resetStuckCookie(response, request);
  const contentType = reset.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return reset;

  const active = activePlayerNextMatchMission(request, env);
  if (!active) return reset;
  const url = new URL(request.url);
  const stuck = cookieMap(request).get(STUCK_COOKIE) === '1';
  const headers = new Headers(reset.headers);
  headers.set('cache-control', 'no-store');
  let html = await reset.text();

  if (url.pathname === '/qa/mission/finish') html = enhanceCheckpoint(html, stuck);
  if (['/', '/schedule'].includes(url.pathname)) html = enhanceProductHtml(html, active.fixture, url.pathname, stuck);

  return new Response(html, { status: reset.status, statusText: reset.statusText, headers });
}
