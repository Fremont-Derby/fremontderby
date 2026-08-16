/**
 * Public SEO + sharing metadata for crawlable surfaces (#248).
 * Injected after page HTML is produced; safe no-op for non-HTML.
 */
const PAGE_SEO = Object.freeze({
  '/': {
    title: 'Fremont Derby',
    description:
      'Fremont Derby is a neighborhood billiards league. Check schedules, standings, teams, and score league nights.',
  },
  '/standings': {
    title: 'Standings · Fremont Derby',
    description:
      'Current and historical Fremont Derby team and individual standings for the active season.',
  },
  '/schedule': {
    title: 'Schedule · Fremont Derby',
    description: 'League-night schedule, tables, and match status for Fremont Derby.',
  },
  '/rules': {
    title: 'League Rules · Fremont Derby',
    description: 'Official Fremont Derby league rules for regular season, playoffs, and scoring.',
  },
  '/demo': {
    title: 'Test Drive · Fremont Derby',
    description:
      'Try a fictional Fremont Derby league night (War Games test drive). Demo data only — not live season results.',
  },
  '/teams': {
    title: 'Teams · Fremont Derby',
    description: 'Team registration, rosters, and captain tools for Fremont Derby.',
  },
  '/scorecard': {
    title: 'Score a Match · Fremont Derby',
    description: 'Score a Fremont Derby matchup and keep both sides on the same card.',
  },
  '/prizes': {
    title: 'Prizes · Fremont Derby',
    description: 'Season prize structure for Fremont Derby team and individual awards.',
  },
  '/playoffs': {
    title: 'Playoffs · Fremont Derby',
    description: 'Playoff bracket and postseason information for Fremont Derby.',
  },
});

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function seoForPath(pathname) {
  const path = String(pathname || '/').split('?')[0] || '/';
  return PAGE_SEO[path] || null;
}

export async function injectPublicSeo(response, pathname) {
  const seo = seoForPath(pathname);
  if (!seo) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  let html = await response.text();
  if (html.includes('data-fd-public-seo')) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }

  const title = seo.title;
  const description = seo.description;
  const canonicalPath = String(pathname || '/').split('?')[0] || '/';
  const tags = [
    `<meta data-fd-public-seo name="description" content="${escapeAttr(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:site_name" content="Fremont Derby" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `<link rel="canonical" href="https://fremontderby.com${canonicalPath === '/' ? '/' : canonicalPath}" />`,
  ].join('');

  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);
  }
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${tags}</head>`);
  }
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
