import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';

export function renderFreeAgentsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Free agents · Fremont Derby</title>
</head>
<body>
  <main class="app" data-fd-dru-free-agents="true">
    <header><h1>Free agents</h1></header>
    <p data-next-match>Looking up your next published match…</p>
    <p>Players looking for a roster. Captains invite from Teams. Published names stay on Player directory.</p>
    <p data-status>No open roster list is published yet. Open Teams to ask a captain, or browse Player directory.</p>
    <ul data-invites hidden></ul>
    <p><a href="/teams">Teams</a> · <a href="/players">Player directory</a> · <a href="/schedule">Schedule</a></p>
  </main>
  <script>
    ${nextMatchSummaryBrowserSource}
    const nextEl = document.querySelector('[data-next-match]');
    fetch('/api/me/matches', { headers: { accept: 'application/json' } })
      .then((response) => response.json())
      .then((body) => {
        const next = pickNextMatch(body.matches || []);
        nextEl.textContent = next
          ? ('Next match: ' + nextMatchLabel(next))
          : 'No upcoming match published.';
      })
      .catch(() => {
        nextEl.textContent = 'Could not load matches.';
      });
    const statusEl = document.querySelector('[data-status]');
    const listEl = document.querySelector('[data-invites]');
    fetch('/api/me/invitations', { headers: { accept: 'application/json' } })
      .then((response) => response.json())
      .then((body) => {
        const invites = body.invitations || [];
        if (!invites.length) {
          statusEl.textContent = 'No open roster list is published yet. Open Teams to ask a captain, or browse Player directory.';
          return;
        }
        listEl.hidden = false;
        for (const invite of invites) {
          const item = document.createElement('li');
          item.textContent = invite.team_name || invite.teamName || 'Team invite';
          listEl.append(item);
        }
        statusEl.textContent = invites.length + ' team invite' + (invites.length === 1 ? '' : 's') + ' waiting.';
      })
      .catch(() => {
        statusEl.textContent = 'Could not load invitations. Open Teams to ask a captain.';
      });
  </script>
</body>
</html>`;
}
