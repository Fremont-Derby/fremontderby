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

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
