const mobileMenuStyles = `
  /* Mobile drawer is a light surface nested inside the dark shared shell. */
  .fd-shell .fd-nav--mobile {
    background: var(--fd-bg-surface, #ffffff) !important;
    color: var(--fd-text, #171b19) !important;
    border-color: var(--fd-border, #d7d9d7) !important;
  }
  .fd-shell .fd-nav--mobile a {
    min-height: 44px !important;
    width: 100%;
    color: var(--fd-text, #171b19) !important;
    background: transparent !important;
    border: 1px solid transparent !important;
    opacity: 1 !important;
  }
  .fd-shell .fd-nav--mobile a:hover {
    color: var(--fd-primary-strong, #074a2b) !important;
    background: var(--fd-bg-subtle, #f8f7f4) !important;
  }
  .fd-shell .fd-nav--mobile a[aria-current="page"] {
    color: var(--fd-green-950, #06341f) !important;
    background: var(--fd-green-100, #e8f3ec) !important;
    border-color: #b6d4c1 !important;
    box-shadow: inset 4px 0 0 var(--fd-primary, #096238) !important;
    font-weight: 900 !important;
  }
  .fd-shell .fd-nav--mobile a[aria-current="page"]::after {
    content: 'Current';
    margin-left: auto;
    padding-left: 12px;
    color: var(--fd-primary-strong, #074a2b);
    font-size: .7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .fd-shell:has(.fd-nav-menu[open]) { z-index: 1200; }
  .fd-shell:has(.fd-nav-menu[open]) + .fd-mobile-dock {
    opacity: .2;
    pointer-events: none;
  }

  @media (forced-colors: active) {
    .fd-shell .fd-nav--mobile,
    .fd-shell .fd-nav--mobile a {
      forced-color-adjust: auto !important;
    }
    .fd-shell .fd-nav--mobile a {
      color: LinkText !important;
      opacity: 1 !important;
    }
    .fd-shell .fd-nav--mobile a[aria-current="page"] {
      color: CanvasText !important;
      background: Canvas !important;
      border: 2px solid Highlight !important;
      box-shadow: none !important;
    }
  }
`;

const mobileMenuScript = `
(() => {
  const menu = document.querySelector('.fd-nav-menu');
  const summary = menu && menu.querySelector(':scope > summary');
  const drawer = menu && menu.querySelector('.fd-nav--mobile');
  const dock = document.querySelector('[data-fd-mobile-dock]');
  if (!menu || !summary || !drawer) return;

  let wasOpen = Boolean(menu.open);
  const syncMenuState = () => {
    const open = Boolean(menu.open);
    if (dock) dock.inert = open;
    if (open && !wasOpen) {
      queueMicrotask(() => drawer.querySelector('a')?.focus());
    } else if (!open && wasOpen && drawer.contains(document.activeElement)) {
      summary.focus();
    }
    wasOpen = open;
  };

  menu.addEventListener('toggle', syncMenuState);
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open) return;
    event.preventDefault();
    menu.open = false;
    summary.focus();
  });
  syncMenuState();
})();
`;

export async function injectMobileMenuAccessibility(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  let html = await response.text();
  if (html.includes('data-fd-mobile-menu-accessibility')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  if (/<\/head>/i.test(html)) {
    html = html.replace(
      /<\/head>/i,
      `<style data-fd-mobile-menu-accessibility>${mobileMenuStyles}</style>\n</head>`,
    );
  }
  if (/<\/body>/i.test(html)) {
    html = html.replace(
      /<\/body>/i,
      `<script data-fd-mobile-menu-accessibility-script>${mobileMenuScript}</script>\n</body>`,
    );
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export { mobileMenuStyles, mobileMenuScript };
