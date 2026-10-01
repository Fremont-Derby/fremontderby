const PUBLIC_SURFACES = new Map([
  ['/rules', 'rules'],
  ['/demo', 'test-drive'],
]);

export const publicSurfaceThemeStyles = `
  body[data-fd-public-surface] {
    color-scheme: light !important;
    overflow-x: hidden;
    background: var(--fd-bg-page) !important;
    color: var(--fd-text) !important;
  }
  body[data-fd-public-surface] *,
  body[data-fd-public-surface] *::before,
  body[data-fd-public-surface] *::after { min-width: 0; }

  /* Rules stays a readable document, not a wall of cards. */
  body[data-fd-public-surface="rules"] .public-page {
    max-width: 760px;
    color: var(--fd-text) !important;
  }
  body[data-fd-public-surface="rules"] .public-page p,
  body[data-fd-public-surface="rules"] .public-page li { color: var(--fd-text) !important; }
  body[data-fd-public-surface="rules"] .public-page .lead,
  body[data-fd-public-surface="rules"] .public-page .note { color: var(--fd-text-muted) !important; }
  body[data-fd-public-surface="rules"] .public-page h2 {
    padding-top: 4px;
    color: var(--fd-primary-strong) !important;
  }
  body[data-fd-public-surface="rules"] .public-page .eyebrow { color: var(--fd-primary) !important; }
  body[data-fd-public-surface="rules"] .public-page .note { border-color: var(--fd-border) !important; }

  /* Test Drive keeps its unmistakable demo banner while using normal product surfaces. */
  body[data-fd-public-surface="test-drive"] main {
    color: var(--fd-text) !important;
  }
  body[data-fd-public-surface="test-drive"] a { color: var(--fd-primary-strong) !important; }

  body[data-fd-public-surface="test-drive"] a.button,
  body[data-fd-public-surface="test-drive"] button,
  body[data-fd-public-surface="test-drive"] .button,
  body[data-fd-public-surface="rules"] a.button,
  body[data-fd-public-surface="rules"] button {
    min-height: 44px !important;
    min-width: 44px !important;
  }
  body[data-fd-public-surface="test-drive"] .demo-banner {
    color: #241e0c !important;
    background: var(--fd-accent) !important;
    border: 1px solid #c59e1b !important;
    border-top: 0 !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  body[data-fd-public-surface="test-drive"] .hero,
  body[data-fd-public-surface="test-drive"] .card,
  body[data-fd-public-surface="test-drive"] .round,
  body[data-fd-public-surface="test-drive"] .step,
  body[data-fd-public-surface="test-drive"] details {
    color: var(--fd-text) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }
  body[data-fd-public-surface="test-drive"] h1,
  body[data-fd-public-surface="test-drive"] h2 { color: var(--fd-text) !important; }
  body[data-fd-public-surface="test-drive"] h3,
  body[data-fd-public-surface="test-drive"] .kicker { color: var(--fd-primary) !important; }
  body[data-fd-public-surface="test-drive"] p,
  body[data-fd-public-surface="test-drive"] .muted,
  body[data-fd-public-surface="test-drive"] .meta { color: var(--fd-text-muted) !important; }
  body[data-fd-public-surface="test-drive"] .chip {
    color: var(--fd-primary-strong) !important;
    background: var(--fd-green-100) !important;
    border-color: #b6d4c1 !important;
  }
  body[data-fd-public-surface="test-drive"] .button,
  body[data-fd-public-surface="test-drive"] .reset,
  body[data-fd-public-surface="test-drive"] button {
    min-height: 44px !important;
  }
  body[data-fd-public-surface="test-drive"] .button.primary,
  body[data-fd-public-surface="test-drive"] button.primary {
    color: var(--fd-primary-text) !important;
    background: var(--fd-primary-strong) !important;
    border-color: var(--fd-primary-strong) !important;
  }
  body[data-fd-public-surface="test-drive"] .button:not(.primary),
  body[data-fd-public-surface="test-drive"] .reset {
    color: var(--fd-primary-strong) !important;
    background: var(--fd-bg-surface) !important;
    border-color: var(--fd-border-control) !important;
  }
  body[data-fd-public-surface="test-drive"] table,
  body[data-fd-public-surface="test-drive"] th,
  body[data-fd-public-surface="test-drive"] td,
  body[data-fd-public-surface="test-drive"] .pairing { border-color: var(--fd-border) !important; }
  body[data-fd-public-surface="test-drive"] th { color: var(--fd-text-muted) !important; }

  @media (max-width: 720px) {
    body[data-fd-public-surface] main { width: min(100% - 24px, 760px) !important; }
    body[data-fd-public-surface="rules"] .public-page { padding-inline: 0; }
    body[data-fd-public-surface="test-drive"] .hero { padding: 18px !important; }
    body[data-fd-public-surface="test-drive"] .demo-banner { margin-inline: -12px !important; }
  }
  @media (forced-colors: active) {
    body[data-fd-public-surface] a,
    body[data-fd-public-surface] button,
    body[data-fd-public-surface] .demo-banner,
    body[data-fd-public-surface] .hero,
    body[data-fd-public-surface] .card,
    body[data-fd-public-surface] .round,
    body[data-fd-public-surface] .step,
    body[data-fd-public-surface] details {
      forced-color-adjust: auto;
      border-color: CanvasText !important;
    }
  }
`;

export async function injectPublicSurfaceTheme(response, pathname) {
  const surface = PUBLIC_SURFACES.get(pathname) || '';
  if (!surface) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  let html = await response.text();
  if (html.includes('data-fd-public-surface-theme')) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }
  html = html.replace(/<body([^>]*)>/i, `<body$1 data-fd-public-surface="${surface}">`);
  html = html.replace('</head>', `<style data-fd-public-surface-theme>${publicSurfaceThemeStyles}</style></head>`);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
