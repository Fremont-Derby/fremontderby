export const playerCoreThemeStyles = `
  /* #427: Schedule, Score picker, and Profile keep their page geometry but inherit one light visual language. */
  main.app:has([data-season-select]),
  main.app:has([data-filters]),
  main.app:has([data-profile-form]) {
    color-scheme: light;
    color: var(--fd-text, #171b19) !important;
  }

  /* Schedule. */
  main.app:has([data-season-select]) .topbar,
  main.app:has([data-season-select]) .controls,
  main.app:has([data-season-select]) .round-head {
    color: var(--fd-text, #171b19) !important;
    border-color: var(--fd-border, #d7d9d7) !important;
  }
  main.app:has([data-season-select]) label,
  main.app:has([data-season-select]) .status,
  main.app:has([data-season-select]) .round-meta,
  main.app:has([data-season-select]) .match-top,
  main.app:has([data-season-select]) .empty {
    color: var(--fd-text-muted, #666b68) !important;
  }
  main.app:has([data-season-select]) .status[data-tone="error"] { color: var(--fd-danger-text, #8f271f) !important; }
  main.app:has([data-season-select]) .status[data-tone="ok"] { color: var(--fd-success, #08733d) !important; }
  main.app:has([data-season-select]) select {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border: 1px solid var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-season-select]) .round,
  main.app:has([data-season-select]) .match {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border, #d7d9d7) !important;
    box-shadow: var(--fd-shadow-soft, 0 3px 10px rgba(25,31,27,.08)) !important;
  }
  main.app:has([data-season-select]) .match-actions a {
    color: var(--fd-primary-strong, #074a2b) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-season-select]) .match-actions a.primary {
    color: var(--fd-primary-text, #ffffff) !important;
    background: var(--fd-primary-strong, #074a2b) !important;
    border-color: var(--fd-primary-strong, #074a2b) !important;
  }
  main.app:has([data-season-select]) .versus span,
  main.app:has([data-season-select]) .kicker { color: var(--fd-primary, #096238) !important; }

  /* Score picker. */
  main.app:has([data-filters]) .head,
  main.app:has([data-filters]) .filters,
  main.app:has([data-filters]) .status,
  main.app:has([data-filters]) .match,
  main.app:has([data-filters]) .empty {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border, #d7d9d7) !important;
    box-shadow: var(--fd-shadow-soft, 0 3px 10px rgba(25,31,27,.08)) !important;
  }
  main.app:has([data-filters]) .muted,
  main.app:has([data-filters]) .filters label,
  main.app:has([data-filters]) .teams,
  main.app:has([data-filters]) .meta,
  main.app:has([data-filters]) .empty p { color: var(--fd-text-muted, #666b68) !important; }
  main.app:has([data-filters]) .filters select {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border: 1px solid var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-filters]) .status[data-tone="error"] {
    color: var(--fd-danger-text, #8f271f) !important;
    background: var(--fd-danger-bg, #fff0ed) !important;
    border-color: var(--fd-danger, #cb3f35) !important;
  }
  main.app:has([data-filters]) .status[data-tone="ready"] {
    color: var(--fd-success, #08733d) !important;
    background: var(--fd-success-bg, #edf7f0) !important;
    border-color: #9bc9ab !important;
  }
  main.app:has([data-filters]) .side {
    color: var(--fd-primary-strong, #074a2b) !important;
    background: var(--fd-green-100, #e8f3ec) !important;
    border: 1px solid #b6d4c1 !important;
  }
  main.app:has([data-filters]) .button.secondary {
    color: var(--fd-primary-strong, #074a2b) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }

  /* Profile. */
  main.app:has([data-profile-form]) .topbar,
  main.app:has([data-profile-form]) .panel-head {
    color: var(--fd-text, #171b19) !important;
    border-color: var(--fd-border, #d7d9d7) !important;
  }
  main.app:has([data-profile-form]) .panel,
  main.app:has([data-profile-form]) .admin-tools {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border, #d7d9d7) !important;
    box-shadow: var(--fd-shadow-soft, 0 3px 10px rgba(25,31,27,.08)) !important;
  }
  main.app:has([data-profile-form]) label,
  main.app:has([data-profile-form]) .hint,
  main.app:has([data-profile-form]) .status,
  main.app:has([data-profile-form]) .empty,
  main.app:has([data-profile-form]) th { color: var(--fd-text-muted, #666b68) !important; }
  main.app:has([data-profile-form]) .status[data-tone="error"] { color: var(--fd-danger-text, #8f271f) !important; }
  main.app:has([data-profile-form]) .status[data-tone="ok"] { color: var(--fd-success, #08733d) !important; }
  main.app:has([data-profile-form]) input {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border: 1px solid var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-profile-form]) .rating {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-subtle, #f8f7f4) !important;
    border: 1px solid var(--fd-border, #d7d9d7) !important;
  }
  main.app:has([data-profile-form]) .badge {
    color: var(--fd-primary-strong, #074a2b) !important;
    background: var(--fd-green-100, #e8f3ec) !important;
    border: 1px solid #b6d4c1 !important;
  }
  main.app:has([data-profile-form]) .ghost,
  main.app:has([data-profile-form]) .admin-actions a {
    color: var(--fd-primary-strong, #074a2b) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-profile-form]) table,
  main.app:has([data-profile-form]) th,
  main.app:has([data-profile-form]) td,
  main.app:has([data-profile-form]) tr { border-color: var(--fd-border, #d7d9d7) !important; }

  @media (forced-colors: active) {
    main.app:has([data-season-select]) .round,
    main.app:has([data-season-select]) .match,
    main.app:has([data-filters]) .filters,
    main.app:has([data-filters]) .match,
    main.app:has([data-profile-form]) .panel,
    main.app:has([data-profile-form]) input {
      forced-color-adjust: auto !important;
    }
  }
`;

const PAGE_HOOKS = ['data-season-select', 'data-filters', 'data-profile-form'];

export async function injectPlayerCoreTheme(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  if (!PAGE_HOOKS.some((hook) => html.includes(hook)) || html.includes('data-fd-player-core-theme')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const themed = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-player-core-theme>${playerCoreThemeStyles}</style>\n</head>`)
    : html;

  return new Response(themed, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
