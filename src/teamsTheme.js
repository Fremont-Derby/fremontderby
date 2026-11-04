export const teamsThemeStyles = `
  /* Teams keeps its dense roster/recruiting layout, but not the legacy dark page theme. */
  main.app:has([data-night-hub]) {
    color-scheme: light;
    color: var(--fd-text, #171b19) !important;
  }
  main.app:has([data-night-hub]) .topbar,
  main.app:has([data-night-hub]) .night-hub,
  main.app:has([data-night-hub]) .setup {
    border-color: var(--fd-border, #d7d9d7) !important;
  }
  main.app:has([data-night-hub]) .status,
  main.app:has([data-night-hub]) label,
  main.app:has([data-night-hub]) .action-meta,
  main.app:has([data-night-hub]) .metric span,
  main.app:has([data-night-hub]) th,
  main.app:has([data-night-hub]) .empty,
  main.app:has([data-night-hub]) .hint,
  main.app:has([data-night-hub]) .team-choice small {
    color: var(--fd-text-muted, #666b68) !important;
  }
  main.app:has([data-night-hub]) .status[data-tone="error"] {
    color: var(--fd-danger, #8f271f) !important;
  }
  main.app:has([data-night-hub]) .status[data-tone="ok"],
  main.app:has([data-night-hub]) .state-kicker,
  main.app:has([data-night-hub]) .hub-kicker,
  main.app:has([data-night-hub]) .hint a {
    color: var(--fd-primary, #096238) !important;
  }
  main.app:has([data-night-hub]) .page-state,
  main.app:has([data-night-hub]) .metric,
  main.app:has([data-night-hub]) .panel,
  main.app:has([data-night-hub]) .hub-team,
  main.app:has([data-night-hub]) .action-card {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border, #d7d9d7) !important;
    box-shadow: var(--fd-shadow-soft, 0 3px 10px rgba(25,31,27,.08)) !important;
  }
  main.app:has([data-night-hub]) .page-state {
    border-top-color: var(--fd-primary, #096238) !important;
  }
  main.app:has([data-night-hub]) .page-state p {
    color: var(--fd-text-muted, #666b68) !important;
  }
  main.app:has([data-night-hub]) .panel-head,
  main.app:has([data-night-hub]) th,
  main.app:has([data-night-hub]) td,
  main.app:has([data-night-hub]) .team-choice {
    border-color: var(--fd-border, #d7d9d7) !important;
  }
  main.app:has([data-night-hub]) input,
  main.app:has([data-night-hub]) select {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-night-hub]) .action-card:hover {
    background: var(--fd-bg-subtle, #f6f5f2) !important;
  }
  main.app:has([data-night-hub]) .action-card--primary {
    background: var(--fd-bg-accent-soft, #e7f2eb) !important;
    border-top-color: var(--fd-primary, #096238) !important;
  }
  main.app:has([data-night-hub]) .action-label,
  main.app:has([data-night-hub]) .action-cta {
    color: var(--fd-primary-strong, #074a2b) !important;
  }
  main.app:has([data-night-hub]) .primary,
  main.app:has([data-night-hub]) .state-action,
  main.app:has([data-night-hub]) .chat-link,
  main.app:has([data-night-hub]) .signin {
    color: var(--fd-primary-text, #ffffff) !important;
    background: var(--fd-primary-strong, #074a2b) !important;
    border-color: var(--fd-primary-strong, #074a2b) !important;
  }
  main.app:has([data-night-hub]) .secondary {
    color: #171307 !important;
    background: var(--fd-accent, #e9bd45) !important;
    border-color: var(--fd-accent, #e9bd45) !important;
  }
  main.app:has([data-night-hub]) .ghost,
  main.app:has([data-night-hub]) .state-action--secondary {
    color: var(--fd-primary-strong, #074a2b) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-night-hub]) .danger {
    color: #ffffff !important;
    background: var(--fd-danger, #8f271f) !important;
    border-color: var(--fd-danger, #8f271f) !important;
  }
  main.app:has([data-night-hub]) .badge {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-subtle, #f6f5f2) !important;
    border: 1px solid var(--fd-border, #d7d9d7) !important;
  }

  @media (forced-colors: active) {
    main.app:has([data-night-hub]) .page-state,
    main.app:has([data-night-hub]) .metric,
    main.app:has([data-night-hub]) .panel,
    main.app:has([data-night-hub]) .action-card,
    main.app:has([data-night-hub]) .badge {
      forced-color-adjust: auto !important;
    }
  }
`;

export async function injectTeamsTheme(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  if (!html.includes('data-night-hub') || html.includes('data-fd-teams-theme')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const themed = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-teams-theme>${teamsThemeStyles}</style>\n</head>`)
    : html;

  return new Response(themed, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
