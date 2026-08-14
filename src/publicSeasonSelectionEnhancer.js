import { publicSeasonSelectionBrowserSource } from './publicSeasonSelection.js';
import { applyScriptNonces } from './securityHeaders.js';

const ROUTES = new Set(['/schedule', '/standings', '/prizes']);

function replaceRequired(html, current, replacement, label) {
  if (!html.includes(current)) {
    throw new Error(`Public season selection integration drifted for ${label}`);
  }
  return html.replace(current, replacement);
}

function nonceFromHtmlOrHeaders(html, headers) {
  const fromTag = html.match(/<script\b[^>]*\bnonce=(["'])([^"']+)\1/i);
  if (fromTag?.[2]) return fromTag[2];
  const csp = headers?.get?.('content-security-policy') || '';
  const fromCsp = csp.match(/nonce-([A-Za-z0-9_+\/=-]+)/);
  return fromCsp?.[1] || '';
}

export async function enhancePublicSeasonSelection(response, pathname) {
  if (!ROUTES.has(pathname)) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  let html = await response.text();
  const nonce = nonceFromHtmlOrHeaders(html, headers);
  // Define on window so later scripts can always resolve the helper, even if
  // a future transform reorders tags. Nonce is required for CSP script-src.
  const helper = nonce
    ? `<script nonce="${nonce}">window.choosePublicSeason=${publicSeasonSelectionBrowserSource};var choosePublicSeason=window.choosePublicSeason;</script>`
    : `<script>window.choosePublicSeason=${publicSeasonSelectionBrowserSource};var choosePublicSeason=window.choosePublicSeason;</script>`;
  html = replaceRequired(html, '</head>', `${helper}</head>`, `${pathname} helper`);
  if (nonce) html = applyScriptNonces(html, nonce);

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
      "function preferredSeason(seasons) {\n      return seasons.find((season) => season.status === 'active')\n        || seasons.find((season) => season.status === 'playoffs')\n        || seasons.find((season) => season.status === 'registration')\n        || seasons.find((season) => season.status === 'complete')\n        || seasons[0]\n        || null;\n    }",
      "function preferredSeason(seasons) {\n      return choosePublicSeason(seasons, { explicitId: requestedSeason, rememberedId: rememberedSeason });\n    }",
      'prizes preferredSeason',
    );
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
