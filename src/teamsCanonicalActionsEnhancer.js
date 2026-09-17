const REQUESTED_TEAM_SCRIPT = `<script data-requested-team-marker>
(() => {
  const requested = new URLSearchParams(location.search).get('team');
  if (!requested) return;
  const target = requested.trim().toLowerCase();
  const nodes = document.querySelectorAll('[data-team-id], [data-team-name], [data-team]');
  for (const el of nodes) {
    const hay = [el.getAttribute('data-team-id'), el.getAttribute('data-team-name'), el.getAttribute('data-team')]
      .join(' ')
      .toLowerCase();
    if (hay.split(/\s+/).includes(target) || hay === target) el.setAttribute('data-requested-team', 'true');
  }
})();
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
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
