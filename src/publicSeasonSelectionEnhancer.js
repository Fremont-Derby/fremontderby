import { publicSeasonSelectionBrowserSource } from './publicSeasonSelection.js';
import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';
import { standingsHighlightBrowserSource } from './standingsHighlight.js';

const ROUTES = new Set(['/schedule', '/standings', '/prizes']);

function replaceRequired(html, current, replacement, label) {
  if (!html.includes(current)) {
    throw new Error(`Public season selection integration drifted for ${label}`);
  }
  return html.replace(current, replacement);
}

function injectNextMatch(html) {
  if (html.includes('data-next-match')) return html;
  html = html.replace('</header>', '</header><p data-next-match>Looking up your next published match…</p>');
  return html.replace(
    '</body>',
    `<script>
      ${nextMatchSummaryBrowserSource}
      (()=>{const nextEl=document.querySelector('[data-next-match]');if(!nextEl)return;fetch('/api/me/matches',{headers:{accept:'application/json'}}).then((response)=>response.json()).then((body)=>{const next=pickNextMatch(body.matches||[]);nextEl.textContent=next?('Next match: '+nextMatchLabel(next)):'No upcoming match published.';}).catch(()=>{nextEl.textContent='Could not load matches.';});})();
    </script></body>`,
  );
}

function injectTeamHighlight(html) {
  if (html.includes('data-standings-highlight')) return html;
  html = html.replace('</header>', '</header><p data-standings-highlight hidden></p>');
  return html.replace(
    '</body>',
    `<script>
      ${standingsHighlightBrowserSource}
      (()=>{
        const query=new URLSearchParams(location.search);
        const requested=query.get('team')||query.get('q');
        const banner=document.querySelector('[data-standings-highlight]');
        if(!requested||!banner)return;
        banner.hidden=false;
        banner.textContent='Showing team: '+requested;
        banner.setAttribute('data-requested-standing', requested);
      })();
    </script></body>`,
  );
}

export async function enhancePublicSeasonSelection(response, pathname) {
  if (!ROUTES.has(pathname)) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  let html = await response.text();
  const helper = `<script>const choosePublicSeason=${publicSeasonSelectionBrowserSource};</script>`;
  html = replaceRequired(html, '</head>', `${helper}</head>`, `${pathname} helper`);

  if (pathname === '/schedule') {
    html = replaceRequired(
      html,
      "const query=new URLSearchParams(location.search);const requestedSeason=query.get('season')||localStorage.getItem('fd.scheduleSeasonId')||'';const requestedRound=query.get('round')||localStorage.getItem('fd.scheduleRoundId')||'';let seasons=[];let rounds=[];",
      "const query=new URLSearchParams(location.search);const requestedSeason=query.get('season')||'';const rememberedSeason=localStorage.getItem('fd.scheduleSeasonId')||'';const requestedRound=query.get('round')||localStorage.getItem('fd.scheduleRoundId')||'';let seasons=[];let rounds=[];",
      'schedule selection inputs',
    );
    html = replaceRequired(
      html,
      "const current=seasons.find((season)=>['active','playoffs'].includes(season.status))||seasons[0];seasonSelect.value=requestedSeason&&seasons.some((season)=>season.id===requestedSeason)?requestedSeason:current.id;seasonSelect.disabled=false",
      "const selected=choosePublicSeason(seasons,{explicitId:requestedSeason,rememberedId:rememberedSeason});seasonSelect.value=selected?.id||'';seasonSelect.disabled=false",
      'schedule default',
    );
  }

  if (pathname === '/standings') {
    html = replaceRequired(
      html,
      "const explicit=seasons.find((season)=>season.id===requestedSeasonId);const registration=seasons.find((season)=>season.status==='registration');const remembered=seasons.find((season)=>season.id===rememberedSeasonId);const selected=explicit||remembered||registration||seasons[0];seasonInput.value=selected?.id||'';",
      "const selected=choosePublicSeason(seasons,{explicitId:requestedSeasonId,rememberedId:rememberedSeasonId});seasonInput.value=selected?.id||'';",
      'standings default',
    );
    html = injectNextMatch(html);
    html = injectTeamHighlight(html);
  }

  if (pathname === '/prizes') {
    html = replaceRequired(
      html,
      "function preferredSeason(seasons) {\n      const explicit = seasons.find((season) => season.id === requestedSeason);\n      const remembered = seasons.find((season) => season.id === rememberedSeason);\n      return explicit\n        || remembered\n        || seasons.find((season) => ['active', 'playoffs'].includes(season.status))\n        || seasons.find((season) => season.status === 'registration')\n        || seasons.find((season) => season.status === 'complete')\n        || seasons[0];\n    }",
      "function preferredSeason(seasons) {\n      return choosePublicSeason(seasons, { explicitId: requestedSeason, rememberedId: rememberedSeason });\n    }",
      'prizes default',
    );
    html = injectNextMatch(html);
    html = injectTeamHighlight(html);
  }

  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
