import { activeCaptainAddPlayersMission } from './qaCaptainAddPlayersMission.js';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function enhanceQaCaptainMissionFraming(response, request, env = {}) {
  if (!response || request?.method !== 'GET') return response;
  const active = activeCaptainAddPlayersMission(request, env);
  if (!active) return response;

  const url = new URL(request.url);
  if (!['/', '/teams'].includes(url.pathname)) return response;
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;

  const { fixture } = active;
  const [first, second] = fixture.targets;
  const hud = `<aside class="fd-qa-captain fd-qa-captain--staged" aria-label="Staged QA captain mission">
    <div class="fd-qa-captain__k">STAGED QA MISSION · CAPTAIN</div>
    <div class="fd-qa-captain__safety"><strong>Test scenario:</strong> this uses synthetic players and team data. You are not changing a real league or team.</div>
    <div class="fd-qa-captain__who">You are <strong>${esc(fixture.captain.name)}</strong>, captain of <strong>${esc(fixture.team.name)}</strong>.</div>
    <div class="fd-qa-captain__goal"><strong>Your mission:</strong> Invite <strong>${esc(first.display_name)}</strong> and <strong>${esc(second.display_name)}</strong>. Do not invite anyone else.</div>
    <div class="fd-qa-captain__exit"><strong>Finish when:</strong> both named players appear as pending invitations. Then tap <strong>Check mission</strong> and answer 4 quick PASS/FAIL questions.</div>
    <span class="fd-qa-captain__hint">Navigate the staged Fremont Derby experience naturally; there are no route hints.</span>
    <div class="fd-qa-captain__actions">
      <a class="fd-qa-captain__finish" href="/qa/captain-add-players/finish" hidden data-captain-finish>Check mission</a>
      <a class="fd-qa-captain__quit" href="/qa/captain-add-players/end">Abort mission</a>
    </div>
  </aside>`;

  const style = `<style>
    .fd-qa-captain--staged{text-align:center;padding:16px!important}
    .fd-qa-captain--staged .fd-qa-captain__safety{margin:9px auto 0;padding:9px 11px;max-width:720px;border-radius:10px;background:#fff7df;color:#5d4700;font-size:.78rem;line-height:1.4}
    .fd-qa-captain--staged .fd-qa-captain__who,.fd-qa-captain--staged .fd-qa-captain__goal,.fd-qa-captain--staged .fd-qa-captain__exit{max-width:720px;margin-left:auto;margin-right:auto}
    .fd-qa-captain--staged .fd-qa-captain__exit{margin-top:10px;padding-top:10px;border-top:1px solid #bfd6c8;font-size:.8rem;line-height:1.4}
    .fd-qa-captain--staged .fd-qa-captain__hint{display:block;margin:9px auto 0}
    .fd-qa-captain--staged .fd-qa-captain__actions{display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px}
    .fd-qa-captain--staged .fd-qa-captain__finish,.fd-qa-captain--staged .fd-qa-captain__quit{box-sizing:border-box;min-height:44px;margin:0!important;align-items:center;justify-content:center;padding:0 16px;border-radius:10px;font-weight:900}
    .fd-qa-captain--staged .fd-qa-captain__quit{display:inline-flex;border:1px solid #667269;text-decoration:none!important;color:#4d5b53!important;background:#fff}
    @media(max-width:560px){.fd-qa-captain--staged .fd-qa-captain__actions{display:grid;grid-template-columns:1fr;width:100%}.fd-qa-captain--staged .fd-qa-captain__finish,.fd-qa-captain--staged .fd-qa-captain__quit{width:100%}}
  </style>`;

  const html = await response.text();
  if (!html.includes('fd-qa-captain')) return new Response(html, response);
  const enhanced = html
    .replace(/<aside class="fd-qa-captain"[\s\S]*?<\/aside>/, hud)
    .replace('</head>', `${style}</head>`);
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  return new Response(enhanced, { status: response.status, statusText: response.statusText, headers });
}
