import { publicSeasonSelectionBrowserSource } from './publicSeasonSelection.js';

const ROUTES = new Set(['/schedule', '/standings', '/prizes']);

function replaceRequired(html, current, replacement, label) {
  if (!html.includes(current)) {
    throw new Error(`Public season selection integration drifted for ${label}`);
  }
  return html.replace(current, replacement);
}

function enhanceModernSchedule(html) {
  html = replaceRequired(
    html,
    "const current = seasons.find((season) => ['active', 'playoffs'].includes(season.status)) || seasons[0];",
    "const current = seasons.find((season) => ['active', 'playoffs'].includes(season.status)) || seasons.find((season) => season.status === 'complete') || seasons.find((season) => season.status === 'registration') || seasons[0];",
    'modern schedule default',
  );
  html = replaceRequired(
    html,
    "if (!seasonSelect.value) return;\n        setStatus('Loading schedule…');",
    "if (!seasonSelect.value) return;\n        rounds = []; groups.replaceChildren(); emptyEl.hidden = true; roundSelect.replaceChildren(); roundSelect.disabled = true;\n        setStatus('Loading schedule…');",
    'modern schedule loading state',
  );
  html = replaceRequired(
    html,
    "renderRoundSelect(); renderGroups(); focusRound(); setStatus(rounds.length ? 'Schedule ready' : 'Schedule not published', rounds.length ? 'ok' : 'muted');",
    "renderRoundSelect(); renderGroups(); focusRound(); if (!rounds.length) { const selectedSeason = seasons.find((season) => season.id === seasonSelect.value); emptyEl.textContent = (selectedSeason?.name || 'This season') + ' schedule has not been published yet.'; } setStatus(rounds.length ? 'Schedule ready' : 'Schedule not published yet', rounds.length ? 'ok' : 'muted');",
    'modern schedule unpublished state',
  );
  html = replaceRequired(
    html,
    "seasonSelect.addEventListener('change', () => loadSchedule().catch((error) => setStatus(error.message, 'error')));",
    "seasonSelect.addEventListener('change', () => loadSchedule().catch((error) => { rounds = []; groups.replaceChildren(); roundSelect.replaceChildren(); roundSelect.disabled = true; emptyEl.hidden = false; emptyEl.textContent = 'We could not load this schedule. Try this season again.'; setStatus(error.message || 'We could not load the schedule.', 'error'); }));",
    'modern schedule load failure',
  );
  return html;
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
    if (html.includes('data-fd-modern-schedule="true"')) {
      html = enhanceModernSchedule(html);
      return new Response(html, { status: response.status, statusText: response.statusText, headers });
    }
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
    if (html.includes('data-fd-modern-standings="true"')) {
      return new Response(html, { status: response.status, statusText: response.statusText, headers });
    }
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
