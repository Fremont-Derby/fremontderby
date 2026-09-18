import { repairAdminPlayersScript } from './adminPlayersScriptRepair.js';
import { repairAvailabilityScript } from './availabilityScriptRepair.js';
import { repairAdminSeasonTeamsScript } from './adminSeasonTeamsScriptRepair.js';
import { repairLineupScript } from './lineupScriptRepair.js';
import { repairStandingsPageScript } from './standingsScriptRepair.js';
import { repairPlayoffsCopy } from './playoffsCopyRepair.js';
import { repairScorecardScript } from './scorecardScriptRepair.js';
import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';
import { standingsHighlightBrowserSource } from './standingsHighlight.js';

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
  '/free-agents',
]);

function nonceFromHtmlOrHeaders(html, headers) {
  const fromTag = html.match(/<script\b[^>]*\bnonce=(["'])([^"']+)\1/i);
  if (fromTag?.[2]) return fromTag[2];
  const csp = headers?.get?.('content-security-policy') || '';
  const fromCsp = csp.match(/nonce-([A-Za-z0-9_+/\/=-]+)/);
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

function injectPlayerHighlight(html, headers) {
  if (html.includes('data-player-highlight')) return html;
  const nonce = nonceFromHtmlOrHeaders(html, headers);
  const attr = nonce ? ` nonce="${nonce}"` : '';
  html = html.replace('</header>', '</header><p data-player-highlight hidden></p>');
  return html.replace(
    '</body>',
    `<script${attr}>
      (()=>{
        const query=new URLSearchParams(location.search);
        const requested=query.get('player')||query.get('q');
        const banner=document.querySelector('[data-player-highlight]');
        if(!requested||!banner)return;
        banner.hidden=false;
        banner.textContent='Showing player: '+requested;
        const search=document.querySelector('input[type="search"],input[name="q"],input[data-player-search]');
        if(search&&!search.value) search.value=requested;
      })();
    </script></body>`,
  );
}

function injectStandingsHighlight(html, headers) {
  if (html.includes('data-standings-highlight')) return html;
  const nonce = nonceFromHtmlOrHeaders(html, headers);
  const attr = nonce ? ` nonce="${nonce}"` : '';
  html = html.replace('</header>', '</header><p data-standings-highlight hidden></p>');
  return html.replace(
    '</body>',
    `<script${attr}>
      ${standingsHighlightBrowserSource}
      (()=>{
        const query=new URLSearchParams(location.search);
        const requested=query.get('team')||query.get('q');
        const banner=document.querySelector('[data-standings-highlight]');
        if(!requested||!banner)return;
        banner.hidden=false;
        banner.textContent='Showing team: '+requested;
        banner.setAttribute('data-requested-standing', requested);
        for (const row of document.querySelectorAll('[data-team-name], [data-standing-name]')) {
          if (isRequestedStanding(row.getAttribute('data-team-name')||row.getAttribute('data-standing-name')||row.textContent, requested)) {
            row.setAttribute('data-requested-standing-row', 'true');
          }
        }
      })();
    </script></body>`,
  );
}

function injectFreeAgentInvitations(html, headers) {
  if (html.includes('/api/me/invitations') && html.includes('data-invites')) return html;
  const nonce = nonceFromHtmlOrHeaders(html, headers);
  const attr = nonce ? ` nonce="${nonce}"` : '';
  if (!html.includes('data-invites')) {
    html = html.replace(
      '</main>',
      '<p data-invite-status role="status">Checking for team invites…</p><ul data-invites hidden></ul></main>',
    );
  }
  return html.replace(
    '</body>',
    `<script${attr}>
      (()=>{
        const statusEl=document.querySelector('[data-invite-status]');
        const listEl=document.querySelector('[data-invites]');
        if(!statusEl||!listEl)return;
        fetch('/api/me/invitations',{headers:{accept:'application/json'}})
          .then((response)=>response.json())
          .then((body)=>{
            const invites=body.invitations||[];
            if(!invites.length){
              statusEl.textContent='No team invites waiting. Open Teams to ask a captain, or browse Player directory.';
              return;
            }
            listEl.hidden=false;
            for(const invite of invites){
              const item=document.createElement('li');
              item.textContent=invite.team_name||invite.teamName||'Team invite';
              listEl.append(item);
            }
            statusEl.textContent=invites.length+' team invite'+(invites.length===1?'':'s')+' waiting.';
          })
          .catch(()=>{statusEl.textContent='Could not load invitations. Open Teams to ask a captain.';});
      })();
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
  if (pathname === '/playoffs') html = repairPlayoffsCopy(html);
  if (pathname === '/admin/players') html = repairAdminPlayersScript(html);
  if (pathname === '/availability') html = repairAvailabilityScript(html);
  if (pathname === '/admin/season-teams') html = repairAdminSeasonTeamsScript(html);
  if (pathname === '/lineup') html = repairLineupScript(html);
  if (pathname === '/scorecard') html = repairScorecardScript(html);
  html = retireTradesNav(html);
  if (NEXT_MATCH_PATHS.has(pathname)) html = injectNextMatch(html, response.headers);
  if (pathname === '/players') html = injectPlayerHighlight(html, response.headers);
  if (pathname === '/standings' || pathname === '/prizes' || pathname === '/playoffs') {
    html = injectStandingsHighlight(html, response.headers);
  }
  if (pathname === '/free-agents') html = injectFreeAgentInvitations(html, response.headers);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
