const PLAYER_NEXT_MATCH_PREVIEW = '<a class="secondary" href="/qa/mission/preview?mission=player.find-next-match">Preview randomized mission</a>';
const PLAYER_NEXT_MATCH_START = '<a class="primary" href="/qa/mission/start?mission=player.find-next-match">Start mission</a>';
const FIXTURE_PREVIEW_LINK = /<a class="secondary" href="\/qa\/mission\/preview\?mission=([^"]+)">Preview randomized mission<\/a>/g;

const PLAYABLE_CARDS = [
  {
    marker: 'Find when and where you play next, and who your team faces.',
    href: '/qa/mission/start?mission=player.find-next-match',
  },
  {
    marker: 'Mark whether you can play in the upcoming match.',
    href: '/qa/mission/start?mission=player.mark-availability',
  },
];

function comingSoonButton() {
  return '<button type="button" disabled title="This mission is not playable yet">Coming soon</button>';
}

function promotePlayableCards(html) {
  return html.replace(/<article class="mission">[\s\S]*?<\/article>/g, (card) => {
    const playable = PLAYABLE_CARDS.find((item) => card.includes(item.marker));
    if (!playable) return card;
    let updated = card.replace(/COMING (?:SOON|NEXT)/, 'PLAYABLE');
    if (!updated.includes(playable.href)) {
      updated = updated.replace(
        /<button type="button" disabled[^>]*>Coming next<\/button>|<button type="button" disabled[^>]*>Coming soon<\/button>/,
        `<a class="primary" href="${playable.href}">Start mission</a>`,
      );
    }
    return updated;
  });
}

export async function enhanceQaMissionGameUx(response, request, env = {}) {
  if (!response || env.ENVIRONMENT !== 'jfl') return response;

  const url = new URL(request.url);
  if (url.pathname !== '/qa') return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  if (!html.includes('JFL HUMAN QA · PERSONA MISSIONS')) return new Response(html, response);

  const cleaned = html
    .replace(PLAYER_NEXT_MATCH_PREVIEW, PLAYER_NEXT_MATCH_START)
    .replaceAll('FIXTURE READY', 'COMING SOON')
    .replace(FIXTURE_PREVIEW_LINK, comingSoonButton())
    .replace(/<div class="build">Build <code>[^<]*<\/code><\/div>/, '')
    .replace(
      'Fresh runs use seeded randomized data. Playable missions exercise the QA product fixture; “fixture ready” means the randomized Arrange contract exists but product integration is intentionally not faked yet.',
      'Playable missions use fresh randomized test data and the real Fremont Derby experience. Missions that are not ready stay locked until they are genuinely playable.',
    );

  return new Response(promotePlayableCards(cleaned), response);
}
