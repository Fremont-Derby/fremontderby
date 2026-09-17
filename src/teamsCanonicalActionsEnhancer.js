import { teamContextHighlightBrowserSource } from './teamContextHighlight.js';

/**
 * Defensive compatibility for Teams canonical destinations (#531).
 * Source of truth is now src/teamsPage.js; these rewrites are no-ops when
 * the renderer already emits canonical hrefs/copy.
 */
export async function enhanceTeamsCanonicalActions(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  let html = await response.text();

  html = html
    .replaceAll('href="/availability"', 'href="/schedule"')
    .replaceAll("hubManage.href='/trades'", "hubManage.href='#captain-tools'")
    .replaceAll('href="/trades"', 'href="#captain-tools"')
    .replaceAll('Roster & trades', 'Roster management')
    .replaceAll('Handle invites, requests, and player moves.', 'Handle invites, requests, and roster changes.')
    .replaceAll("Message your team or tonight's opponent.", 'Message your team or players directly.');

  if (!html.includes('id="captain-tools"') && html.includes('data-captain-teams')) {
    html = html.replace('<div data-captain-teams></div>', '<div id="captain-tools" data-captain-teams></div>');
  }

  if (!html.includes('data-team-highlight')) {
    const nonceMatch = html.match(/<script\b[^>]*\bnonce=(["'])([^"']+)\1/i);
    const attr = nonceMatch?.[2] ? ` nonce="${nonceMatch[2]}"` : '';
    html = html.replace('</header>', '</header><p data-team-highlight hidden></p>');
    html = html.replace(
      '</body>',
      `<script${attr}>
        ${teamContextHighlightBrowserSource}
        (()=>{
          const requested=new URLSearchParams(location.search).get('team');
          const banner=document.querySelector('[data-team-highlight]');
          if(!requested||!banner)return;
          banner.hidden=false;
          banner.textContent='Showing team: '+requested;
          const mark=(node)=>{
            const team={id:node.getAttribute('data-team-id')||node.dataset.teamId||'',name:node.textContent||''};
            if(isRequestedTeam(team,requested)) node.setAttribute('data-requested-team','true');
          };
          document.querySelectorAll('[data-hub-team],[data-captain-teams] *').forEach(mark);
          const box=document.querySelector('[data-captain-teams]');
          if(box) new MutationObserver(()=>box.querySelectorAll('*').forEach(mark)).observe(box,{childList:true,subtree:true});
        })();
      </script></body>`,
    );
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
