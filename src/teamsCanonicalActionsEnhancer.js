/**
 * Defensive compatibility for Teams canonical destinations (#531).
 * Source of truth is now src/teamsPage.js; these rewrites are no-ops when
 * the renderer already emits canonical hrefs/copy.
 */
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
    .replaceAll("Message your team or tonight's opponent.", 'Message your team or players directly.');

  if (!html.includes('id="captain-tools"') && html.includes('data-captain-teams')) {
    html = html.replace('<div data-captain-teams></div>', '<div id="captain-tools" data-captain-teams></div>');
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
