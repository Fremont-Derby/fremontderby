function addAdminNavigation(html) {
  const adminCurrent = /<body[^>]*>[\s\S]*?<main[^>]*data-admin-gateway/.test(html)
    || /<title>[^<]*Admin[^<]*Fremont Derby<\/title>/.test(html);
  const attrs = adminCurrent ? ' aria-current="page" data-active="true"' : '';
  const adminLink = `<a href="/admin" data-nav-key="admin"${attrs}>Admin</a>`;

  return html.replace(
    /(<nav class="fd-nav fd-nav--desktop"[^>]*>[\s\S]*?)(<a href="\/profile" data-nav-key="profile"[^>]*>Profile<\/a>)/,
    `$1${adminLink}\n$2`,
  ).replace(
    /(<nav class="fd-nav fd-nav--mobile"[^>]*>[\s\S]*?)(<a href="\/profile" data-nav-key="profile"[^>]*>Profile<\/a>)/,
    `$1${adminLink}$2`,
  );
}

export async function normalizeShellNavigationLabels(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  const canonicalSchedule = html.replace(
    /(<a href="\/schedule" data-nav-key="schedule"[^>]*>\s*<span class="fd-mobile-dock__ball"[^>]*>9<\/span>\s*<span>)Tonight(<\/span>\s*<\/a>)/,
    '$1Schedule$2',
  );
  const normalized = addAdminNavigation(canonicalSchedule);

  return new Response(normalized, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
