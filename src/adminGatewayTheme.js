export const adminGatewayThemeStyles = `
  main.app:has([data-admin-content]) {
    color-scheme: light;
    color: var(--fd-text, #171b19) !important;
  }
  main.app:has([data-admin-content]) .hero {
    border-color: var(--fd-border, #d7d9d7) !important;
  }
  main.app:has([data-admin-content]) .hero p,
  main.app:has([data-admin-content]) .state p,
  main.app:has([data-admin-content]) .status,
  main.app:has([data-admin-content]) .card span {
    color: var(--fd-text-muted, #666b68) !important;
  }
  main.app:has([data-admin-content]) .kicker,
  main.app:has([data-admin-content]) .card b {
    color: var(--fd-primary, #096238) !important;
  }
  main.app:has([data-admin-content]) .state,
  main.app:has([data-admin-content]) .card {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border, #d7d9d7) !important;
    box-shadow: var(--fd-shadow-soft, 0 3px 10px rgba(25,31,27,.08)) !important;
  }
  main.app:has([data-admin-content]) .state[data-tone="error"] {
    border-color: var(--fd-danger, #8f271f) !important;
  }
  main.app:has([data-admin-content]) .status[data-tone="error"] {
    color: var(--fd-danger, #8f271f) !important;
  }
  main.app:has([data-admin-content]) .action {
    color: var(--fd-primary-text, #ffffff) !important;
    background: var(--fd-primary-strong, #074a2b) !important;
    border-color: var(--fd-primary-strong, #074a2b) !important;
  }
  main.app:has([data-admin-content]) .action.secondary {
    color: var(--fd-primary-strong, #074a2b) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-admin-content]) .card:hover {
    background: var(--fd-bg-subtle, #f6f5f2) !important;
  }

  @media (forced-colors: active) {
    main.app:has([data-admin-content]) .state,
    main.app:has([data-admin-content]) .card,
    main.app:has([data-admin-content]) .action {
      forced-color-adjust: auto !important;
    }
  }
`;

export async function injectAdminGatewayTheme(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  if (!html.includes('data-admin-content') || html.includes('data-fd-admin-gateway-theme')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const themed = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-admin-gateway-theme>${adminGatewayThemeStyles}</style>\n</head>`)
    : html;

  return new Response(themed, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
