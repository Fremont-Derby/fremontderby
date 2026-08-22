export const messagesThemeStyles = `
  /* Messages keeps its specialized two-column/chat layout, but not the legacy dark page theme. */
  main.app:has([data-chat-layout]) {
    color-scheme: light;
    color: var(--fd-text, #171b19) !important;
  }
  main.app:has([data-chat-layout]) .heading,
  main.app:has([data-chat-layout]) .subhead,
  main.app:has([data-chat-layout]) .status,
  main.app:has([data-chat-layout]) .empty,
  main.app:has([data-chat-layout]) .candidate-help,
  main.app:has([data-chat-layout]) .chat-title small,
  main.app:has([data-chat-layout]) .thread-preview,
  main.app:has([data-chat-layout]) .message-meta,
  main.app:has([data-chat-layout]) .report {
    color: var(--fd-text-muted, #666b68) !important;
  }
  main.app:has([data-chat-layout]) .status[data-tone="error"],
  main.app:has([data-chat-layout]) .block {
    color: var(--fd-danger, #a42f2a) !important;
  }
  main.app:has([data-chat-layout]) .status[data-tone="ok"] {
    color: var(--fd-success, #096238) !important;
  }
  main.app:has([data-chat-layout]) .state-card,
  main.app:has([data-chat-layout]) .layout,
  main.app:has([data-chat-layout]) .threads,
  main.app:has([data-chat-layout]) .new-direct,
  main.app:has([data-chat-layout]) .mobile-picker,
  main.app:has([data-chat-layout]) .panel-title,
  main.app:has([data-chat-layout]) .message-list,
  main.app:has([data-chat-layout]) .composer,
  main.app:has([data-chat-layout]) dialog {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border, #d7d9d7) !important;
    box-shadow: var(--fd-shadow-soft, 0 3px 10px rgba(25,31,27,.08)) !important;
  }
  main.app:has([data-chat-layout]) .layout {
    background: var(--fd-bg-surface, #ffffff) !important;
  }
  main.app:has([data-chat-layout]) .threads {
    background: var(--fd-bg-subtle, #f6f5f2) !important;
  }
  main.app:has([data-chat-layout]) .panel-title,
  main.app:has([data-chat-layout]) .new-direct,
  main.app:has([data-chat-layout]) .mobile-picker,
  main.app:has([data-chat-layout]) .composer {
    border-color: var(--fd-border, #d7d9d7) !important;
  }
  main.app:has([data-chat-layout]) .thread {
    color: var(--fd-text, #171b19) !important;
    background: transparent !important;
    border-color: transparent !important;
  }
  main.app:has([data-chat-layout]) .thread:hover,
  main.app:has([data-chat-layout]) .thread[data-active="true"] {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-accent-soft, #e7f2eb) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-chat-layout]) .section-label {
    color: var(--fd-primary-strong, #074a2b) !important;
  }
  main.app:has([data-chat-layout]) select,
  main.app:has([data-chat-layout]) textarea {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-chat-layout]) .panel-actions button,
  main.app:has([data-chat-layout]) .dialog-actions button,
  main.app:has([data-chat-layout]) .older,
  main.app:has([data-chat-layout]) .empty-actions button,
  main.app:has([data-chat-layout]) .empty-actions a,
  main.app:has([data-chat-layout]) .state-action.secondary {
    color: var(--fd-primary-strong, #074a2b) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-chat-layout]) .state-action,
  main.app:has([data-chat-layout]) .new-direct button,
  main.app:has([data-chat-layout]) .send,
  main.app:has([data-chat-layout]) .empty-actions .primary {
    color: var(--fd-primary-text, #ffffff) !important;
    background: var(--fd-primary-strong, #074a2b) !important;
    border-color: var(--fd-primary-strong, #074a2b) !important;
  }
  main.app:has([data-chat-layout]) .message {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-subtle, #f6f5f2) !important;
    border-color: var(--fd-border, #d7d9d7) !important;
  }
  main.app:has([data-chat-layout]) .message.mine {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-accent-soft, #e7f2eb) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.app:has([data-chat-layout]) .unread {
    color: #171307 !important;
    background: var(--fd-accent, #e9bd45) !important;
  }
  main.app:has([data-chat-layout]) dialog::backdrop {
    background: rgba(23, 27, 25, .45) !important;
  }
  main.app:has([data-chat-layout]) .dialog-form label,
  main.app:has([data-chat-layout]) .empty strong {
    color: var(--fd-text, #171b19) !important;
  }

  @media (forced-colors: active) {
    main.app:has([data-chat-layout]) .layout,
    main.app:has([data-chat-layout]) .threads,
    main.app:has([data-chat-layout]) .message,
    main.app:has([data-chat-layout]) dialog {
      forced-color-adjust: auto !important;
    }
  }
`;

export async function injectMessagesTheme(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  if (!html.includes('data-chat-layout') || html.includes('data-fd-messages-theme')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const themed = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-messages-theme>${messagesThemeStyles}</style>\n</head>`)
    : html;

  return new Response(themed, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
