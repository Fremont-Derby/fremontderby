export async function normalizeShellNavigationLabels(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  const normalized = html.replace(
    /(<a href="\/schedule" data-nav-key="schedule"[^>]*>\s*<span class="fd-mobile-dock__ball"[^>]*>9<\/span>\s*<span>)Tonight(<\/span>\s*<\/a>)/,
    '$1Schedule$2',
  );

  return new Response(normalized, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
