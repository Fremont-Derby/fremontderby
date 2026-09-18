import { decorateHtmlWithShell } from './appShell.js';

function shellPage(pathname, title, heading, bodyHtml) {
  const inner = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
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
    `<p>Players looking for a roster. Captains invite from Teams. Published names stay on Player directory.</p>
     <p>No open roster list is published yet. Open Teams to ask a captain, or browse Player directory.</p>
     <p><a href="/teams">Teams</a> \u00b7 <a href="/players">Player directory</a> \u00b7 <a href="/schedule">Schedule</a></p>`,
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
