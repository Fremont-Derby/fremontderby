import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';

const REQUESTED_TEAM_SCRIPT = `<script data-requested-team-marker>
(() => {
  const requested = new URLSearchParams(location.search).get('team');
  if (!requested) return;
  const target = requested.trim().toLowerCase();
  function matches(el) {
    const hay = [
      el.getAttribute('data-team-id'),
      el.getAttribute('data-team-name'),
      el.getAttribute('data-team'),
      el.textContent,
    ].join(' ').toLowerCase();
    return hay.includes(target);
  }
  function mark() {
    const nodes = document.querySelectorAll('[data-team-id], [data-team-name], [data-team], [data-hub-team], .team-choice');
    for (const el of nodes) {
      if (matches(el)) el.setAttribute('data-requested-team', 'true');
      else el.removeAttribute('data-requested-team');
    }
  }
  mark();
  const observer = new MutationObserver(mark);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
</script>`;

const NEXT_MATCH_SCRIPT = `<script data-teams-next-match>
  ${nextMatchSummaryBrowserSource}
  (()=>{const nextEl=document.querySelector('[data-next-match]');if(!nextEl)return;fetch('/api/me/matches',{headers:{accept:'application/json'}}).then((response)=>response.json()).then((body)=>{const next=pickNextMatch(body.matches||[]);nextEl.textContent=next?('Next match: '+nextMatchLabel(next)):'No upcoming match published.';}).catch(()=>{nextEl.textContent='Could not load matches.';});})();
</script>`;

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
    .replaceAll("Message your team or tonight's opponent.", 'Message your team or players directly.')
    .replace('<div data-captain-teams></div>', '<div id="captain-tools" data-captain-teams></div>');

  if (!html.includes('data-requested-team-marker')) {
    html = html.includes('</body>')
      ? html.replace('</body>', `${REQUESTED_TEAM_SCRIPT}</body>`)
      : html + REQUESTED_TEAM_SCRIPT;
  } else if (!html.includes('[data-hub-team]')) {
    html = html.replace('</body>', `${REQUESTED_TEAM_SCRIPT}</body>`);
  }

  if (!html.includes('data-next-match')) {
    html = html.replace('</header>', '</header><p data-next-match>Looking up your next published match…</p>');
    html = html.includes('</body>')
      ? html.replace('</body>', `${NEXT_MATCH_SCRIPT}</body>`)
      : html + NEXT_MATCH_SCRIPT;
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
