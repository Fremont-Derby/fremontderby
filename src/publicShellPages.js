import { decorateHtmlWithShell } from './appShell.js';
import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';

function shellPage(pathname, title, heading, bodyHtml) {
  const inner = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} \u00b7 Fremont Derby</title>
</head>
<body>
  <main class="app" style="width:min(720px,100%);margin:0 auto;padding:20px 16px 96px;font:16px/1.45 Inter,ui-sans-serif,system-ui,sans-serif">
    <h1 style="margin:0 0 12px;font-size:1.35rem">${heading}</h1>
    ${bodyHtml}
  </main>
</body>
</html>`;
  return decorateHtmlWithShell(inner, pathname);
}

export function renderFreeAgentsPage() {
  return shellPage(
    '/free-agents',
    'Free agents',
    'Free agents',
    `<p data-next-match>Looking up your next published match…</p>
     <p>Players looking for a roster. Captains invite from Teams. Published names stay on Player directory.</p>
     <p data-status>No open roster list is published yet. Open Teams to ask a captain, or browse Player directory.</p>
     <ul data-invites hidden></ul>
     <p><a href="/teams">Teams</a> \u00b7 <a href="/players">Player directory</a> \u00b7 <a href="/schedule">Schedule</a></p>
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
     </script>`,
  );
}

export function renderPracticePage() {
  return shellPage(
    '/practice',
    'Practice',
    'Practice',
    `<p>Practice nights will show up here when the league publishes them.</p>
     <p>Nothing is scheduled on this page yet. Check the season schedule for league nights.</p>
     <p><a href="/schedule">Schedule</a> \u00b7 <a href="/availability">Check in</a> \u00b7 <a href="/teams">Teams</a></p>`,
  );
}
