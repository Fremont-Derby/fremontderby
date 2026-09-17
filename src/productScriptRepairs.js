import { repairAdminPlayersScript } from './adminPlayersScriptRepair.js';
import { repairAvailabilityScript } from './availabilityScriptRepair.js';
import { repairAdminSeasonTeamsScript } from './adminSeasonTeamsScriptRepair.js';
import { repairLineupScript } from './lineupScriptRepair.js';
import { repairStandingsPageScript } from './standingsScriptRepair.js';
import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';

const NEXT_MATCH_PATHS = new Set([
  '/availability',
  '/lineup',
  '/scorecard',
  '/profile',
  '/teams',
  '/playoffs',
  '/schedule',
  '/messages',
  '/notifications',
  '/practice',
  '/players',
]);

function nonceFromHtmlOrHeaders(html, headers) {
  const fromTag = html.match(/<script\b[^>]*\bnonce=(["'])([^"']+)\1/i);
  if (fromTag?.[2]) return fromTag[2];
  const csp = headers?.get?.('content-security-policy') || '';
  const fromCsp = csp.match(/nonce-([A-Za-z0-9_+\/=-]+)/);
  return fromCsp?.[1] || '';
}

function injectNextMatch(html, headers) {
  if (html.includes('data-next-match')) return html;
  const nonce = nonceFromHtmlOrHeaders(html, headers);
  const attr = nonce ? ` nonce="${nonce}"` : '';
  html = html.replace('</header>', '</header><p data-next-match>Looking up your next published match…</p>');
  return html.replace(
    '</body>',
    `<script${attr}>
      ${nextMatchSummaryBrowserSource}
      (()=>{const nextEl=document.querySelector('[data-next-match]');if(!nextEl)return;fetch('/api/me/matches',{headers:{accept:'application/json'}}).then((response)=>response.json()).then((body)=>{const next=pickNextMatch(body.matches||[]);nextEl.textContent=next?('Next match: '+nextMatchLabel(next)):'No upcoming match published.';}).catch(()=>{nextEl.textContent='Could not load matches.';});})();
    </script></body>`,
  );
}

function retireTradesNav(html) {
  return String(html || '')
    .replaceAll('href="/trades"', 'href="/teams"')
    .replaceAll("href='/trades'", "href='/teams'");
}

export async function applyProductScriptRepairs(response, pathname) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  let html = await response.text();
  if (pathname === '/standings') html = repairStandingsPageScript(html);
  if (pathname === '/admin/players') html = repairAdminPlayersScript(html);
  if (pathname === '/availability') html = repairAvailabilityScript(html);
  if (pathname === '/admin/season-teams') html = repairAdminSeasonTeamsScript(html);
  if (pathname === '/lineup') html = repairLineupScript(html);
  html = retireTradesNav(html);
  if (NEXT_MATCH_PATHS.has(pathname)) html = injectNextMatch(html, response.headers);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
