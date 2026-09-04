import { designSystemStyles } from './designSystem.js';

// Final site-wide contract. Page renderers may own layout, but shared shell/navigation
// and standard surfaces are normalized here after every page-local stylesheet.
export const siteStyles = `${designSystemStyles}

  /* #521: one final authority for shared shell/navigation. */
  .fd-shell {
    background:
      repeating-linear-gradient(92deg, rgba(255,255,255,.025) 0 1px, transparent 1px 5px),
      linear-gradient(180deg, #0a4a2d, #06371f) !important;
    border: 0 !important;
    border-bottom: 4px solid var(--fd-wood) !important;
    color: #ffffff !important;
  }
  .fd-shell .fd-nav a {
    min-height: 44px !important;
    border: 1px solid transparent !important;
    background: transparent !important;
    color: #eff8f2 !important;
  }
  .fd-shell .fd-nav a:hover,
  .fd-shell .fd-nav a:focus-visible {
    background: rgba(255,255,255,.12) !important;
    color: #ffffff !important;
  }
  .fd-shell .fd-nav a[aria-current="page"] {
    border-color: #ffffff !important;
    background: #ffffff !important;
    color: var(--fd-green-950) !important;
    font-weight: 900 !important;
  }
  .fd-nav-menu summary {
    border: 1px solid rgba(255,255,255,.38) !important;
    background: rgba(0,0,0,.14) !important;
    color: #ffffff !important;
  }
  .fd-nav--mobile {
    border: 1px solid var(--fd-border) !important;
    background: #ffffff !important;
    color: var(--fd-text) !important;
  }
  .fd-nav--mobile a,
  .fd-nav--mobile a:hover,
  .fd-nav--mobile a:focus-visible {
    background: transparent !important;
    color: var(--fd-text) !important;
  }
  .fd-nav--mobile a[aria-current="page"] {
    background: var(--fd-green-100) !important;
    color: var(--fd-green-950) !important;
    font-weight: 900 !important;
  }

  /* #521: the dock owns all of its geometry and cannot inherit page nav rules. */
  @media (max-width: 760px) {
    html {
      padding-bottom: calc(96px + env(safe-area-inset-bottom)) !important;
    }
    .fd-mobile-dock-spacer {
      display: block !important;
      height: calc(96px + env(safe-area-inset-bottom)) !important;
    }
    .fd-mobile-dock {
      position: fixed !important;
      right: 8px !important;
      bottom: max(8px, env(safe-area-inset-bottom)) !important;
      left: 8px !important;
      z-index: 1050 !important;
      display: grid !important;
      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
      gap: 5px !important;
      margin: 0 !important;
      padding: 6px !important;
      border: 1px solid var(--fd-border) !important;
      border-top: 3px solid var(--fd-wood) !important;
      border-radius: 17px !important;
      background: rgba(255,255,255,.98) !important;
      box-shadow: var(--fd-shadow) !important;
    }
    .fd-mobile-dock a {
      min-width: 0 !important;
      min-height: 58px !important;
      margin: 0 !important;
      padding: 5px 2px !important;
      border: 1px solid transparent !important;
      border-radius: 12px !important;
      background: transparent !important;
      color: var(--fd-text) !important;
    }
    .fd-mobile-dock a[aria-current="page"] {
      border-color: #b6d4c1 !important;
      background: var(--fd-green-100) !important;
      color: var(--fd-green-950) !important;
      font-weight: 900 !important;
    }
  }

  /* #521: one ordinary surface contract. Semantic states may override color only. */
  .card, .panel, .hero, .step, .round, .scoreboard, .race, .team-score, .ledger-panel,
  .edit-panel, .reconcile, .details, details, .match, .metric, .state, .state-card, .page-state,
  .action-card, .admin-tools, article[class*="card"], section[class*="card"] {
    border: 1px solid var(--fd-border) !important;
    border-radius: var(--fd-radius) !important;
    background: var(--fd-bg-surface) !important;
    box-shadow: var(--fd-shadow-soft) !important;
  }

  @media (forced-colors: active) {
    .fd-shell .fd-nav a[aria-current="page"],
    .fd-mobile-dock a[aria-current="page"] {
      border: 2px solid Highlight !important;
      forced-color-adjust: auto;
    }
  }
`;

export async function injectSiteStyles(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  if (html.includes('data-fd-design-system')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const styled = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-design-system>${siteStyles}</style>\n</head>`)
    : html;

  return new Response(styled, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
