import { activeCaptainAddPlayersMission } from './qaCaptainAddPlayersMission.js';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function routeQaCaptainMissionFrame(request, env = {}) {
  if (!request || request.method !== 'GET') return null;
  const active = activeCaptainAddPlayersMission(request, env);
  if (!active) return null;
  const url = new URL(request.url);
  if (url.pathname !== '/qa/captain-add-players/play') return null;

  const { fixture } = active;
  let src = String(url.searchParams.get('src') || '/');
  if (!src.startsWith('/') || src.startsWith('//')) src = '/';
  const [first, second] = fixture.targets;

  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Staged QA Mission · Fremont Derby</title><style>
    :root{font-family:Inter,system-ui,sans-serif;background:#0d1712;color:#fff}*{box-sizing:border-box}html,body{height:100%;margin:0}body{display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden}.qa-head{padding:10px 12px;background:#0d1712;border-bottom:2px solid #53e391;text-align:center}.qa-badge{font-size:.72rem;font-weight:950;letter-spacing:.13em;color:#86f5b4}.qa-head strong{display:block;margin-top:4px;font-size:.95rem}.qa-head p{margin:5px auto 0;max-width:760px;color:#d5e2da;font-size:.78rem;line-height:1.35}.qa-frame-wrap{min-height:0;padding:8px;background:#1a241f}.qa-frame{display:block;width:100%;height:100%;border:2px solid #86f5b4;border-radius:12px;background:#fff}.qa-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:9px 12px calc(9px + env(safe-area-inset-bottom));background:#0d1712;border-top:2px solid #53e391}.qa-controls a{min-height:48px;border-radius:11px;display:grid;place-items:center;justify-content:center;text-align:center;padding:8px 12px;font-weight:900;text-decoration:none}.qa-check{background:#08783f;color:#fff}.qa-abort{background:#fff;color:#7b2020;border:2px solid #cf5555}@media(max-width:520px){.qa-head{padding:8px}.qa-head p{font-size:.74rem}.qa-frame-wrap{padding:6px}.qa-controls{grid-template-columns:1fr}.qa-controls a{min-height:44px}}
  </style></head><body>
    <header class="qa-head">
      <div class="qa-badge" aria-label="STAGED QA MISSION · TEST DATA ONLY">STAGED QA MISSION · CAPTAIN</div>
      <strong>Captain mission: invite ${esc(first.display_name)} and ${esc(second.display_name)}</strong>
      <p>You are ${esc(fixture.captain.name)}, captain of ${esc(fixture.team.name)}. This staged scenario uses synthetic players and team data; you are not changing a real league or team, and this mission cannot change real league data. Finish when: both named players appear as pending invitations and nobody else does. Then use Check mission for 4 quick PASS/FAIL questions.</p>
    </header>
    <main class="qa-frame-wrap"><iframe class="qa-frame" title="Fremont Derby staged interaction" src="${esc(src)}"></iframe></main>
    <footer class="qa-controls" aria-label="Mission controls"><a class="qa-check" data-captain-finish href="/qa/captain-add-players/finish">Check mission</a><a class="qa-abort" href="/qa/captain-add-players/end">Abort mission</a></footer>
  </body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

export async function enhanceQaCaptainMissionFraming(response, request, env = {}) {
  if (!response || request?.method !== 'GET') return response;
  const active = activeCaptainAddPlayersMission(request, env);
  if (!active) return response;

  const url = new URL(request.url);
  if (!['/', '/teams'].includes(url.pathname)) return response;
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;

  let html = await response.text();

  // Mission framing and controls belong outside the interactive product frame.
  html = html.replace(/<aside class="fd-qa-captain"[\s\S]*?<\/aside>/, '');
  const redirect = `<script>(()=>{if(window.top===window.self){const path=location.pathname+location.search;location.replace('/qa/captain-add-players/play?src='+encodeURIComponent(path))}})();</script>`;
  html = html.replace('</body>', `${redirect}</body>`);

  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
