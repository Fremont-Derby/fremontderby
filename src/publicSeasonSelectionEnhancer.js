import { publicSeasonSelectionBrowserSource } from './publicSeasonSelection.js';

const ROUTES = new Set(['/schedule', '/standings', '/prizes']);

function replaceRequired(html, current, replacement, label) {
  if (!html.includes(current)) {
    throw new Error(`Public season selection integration drifted for ${label}`);
  }
  return html.replace(current, replacement);
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
  }

  if (pathname === '/prizes') {
    html = replaceRequired(
      html,
      "function preferredSeason(seasons) {\n      const explicit = seasons.find((season) => season.id === requestedSeason);\n      const remembered = seasons.find((season) => season.id === rememberedSeason);\n      return explicit\n        || remembered\n        || seasons.find((season) => ['active', 'playoffs'].includes(season.status))\n        || seasons.find((season) => season.status === 'registration')\n        || seasons.find((season) => season.status === 'complete')\n        || seasons[0];\n    }",
      "function preferredSeason(seasons) {\n      return choosePublicSeason(seasons, { explicitId: requestedSeason, rememberedId: rememberedSeason });\n    }",
      'prizes default',
    );
  }

  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
