const FIXTURE_PREVIEW_LINK = /<a class="secondary" href="\/qa\/mission\/preview\?mission=([^"]+)">Preview randomized mission<\/a>/g;

function comingSoonButton() {
  return '<button type="button" disabled title="This mission is not playable yet">Coming soon</button>';
}

export async function enhanceQaMissionGameUx(response, request, env = {}) {
  if (!response || env.ENVIRONMENT !== 'jfl') return response;

  const url = new URL(request.url);
  if (url.pathname !== '/qa') return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  if (!html.includes('JFL HUMAN QA · PERSONA MISSIONS')) {
    return new Response(html, response);
  }

  const enhanced = html
    .replaceAll('FIXTURE READY', 'COMING SOON')
    .replace(FIXTURE_PREVIEW_LINK, comingSoonButton())
    .replace(/<div class="build">Build <code>[^<]*<\/code><\/div>/, '')
    .replace(
      'Fresh runs use seeded randomized data. Playable missions exercise the QA product fixture; “fixture ready” means the randomized Arrange contract exists but product integration is intentionally not faked yet.',
      'Playable missions use fresh randomized test data and the real Fremont Derby experience. Missions that are not ready stay locked until they are genuinely playable.'
    );

  return new Response(enhanced, response);
}
