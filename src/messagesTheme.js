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
  main.app:has([data-chat-layout]) [data-thread-key^="matchup:"] {
    display: none !important;
  }
  .fd-mobile-inbox {
    display: none;
  }

  @media (max-width: 759px) {
    main.app:has([data-chat-layout]) [data-thread-select] {
      display: none !important;
    }
    main.app:has([data-chat-layout]) .mobile-picker {
      display: grid;
      gap: 10px;
    }
    main.app:has([data-chat-layout]) .fd-mobile-inbox {
      display: grid;
      gap: 4px;
      width: 100%;
    }
    main.app:has([data-chat-layout]) .fd-mobile-inbox .section-label {
      margin: 10px 4px 2px;
      font-size: .78rem;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    main.app:has([data-chat-layout]) .fd-mobile-inbox .thread {
      display: grid;
      width: 100%;
      min-height: 64px;
      padding: 10px 12px;
      text-align: left;
      border: 1px solid var(--fd-border, #d7d9d7) !important;
      border-radius: 12px;
      background: var(--fd-bg-surface, #ffffff) !important;
    }
    main.app:has([data-chat-layout]) .fd-mobile-inbox .thread[data-active="true"] {
      background: var(--fd-bg-accent-soft, #e7f2eb) !important;
    }
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

export const messagesSimplifierScript = `
  <script data-fd-messages-simplifier>
    (() => {
      const labels = new Map([
        ['League rooms', 'General'],
        ['Player messages', 'Direct'],
        ['Team chats', 'Team'],
      ]);

      function simplifyThreadList() {
        const list = document.querySelector('[data-thread-list]');
        if (!list) return;

        for (const matchup of list.querySelectorAll('[data-thread-key^="matchup:"]')) matchup.hidden = true;
        for (const heading of list.querySelectorAll('.section-label')) {
          const text = heading.textContent.trim();
          if (text === 'Matchup rooms') {
            heading.hidden = true;
          } else if (labels.has(text)) {
            heading.textContent = labels.get(text);
            heading.hidden = false;
          }
        }

        for (const league of list.querySelectorAll('[data-thread-key^="league:"] strong')) {
          const unreadSuffix = league.textContent.includes(' · ') ? league.textContent.slice(league.textContent.indexOf(' · ')) : '';
          league.textContent = 'General' + unreadSuffix;
        }
      }

      function simplifyNativePicker() {
        const select = document.querySelector('[data-thread-select]');
        if (!select) return;
        for (const group of Array.from(select.querySelectorAll('optgroup'))) {
          if (group.label === 'Matchup rooms') {
            group.remove();
            continue;
          }
          if (labels.has(group.label)) group.label = labels.get(group.label);
          if (group.label === 'General') {
            for (const option of group.querySelectorAll('option')) {
              const unread = option.textContent.match(/\s\(\d+\)$/)?.[0] || '';
              option.textContent = 'General' + unread;
            }
          }
        }
      }

      function buildMobileInbox() {
        const picker = document.querySelector('.mobile-picker');
        const list = document.querySelector('[data-thread-list]');
        if (!picker || !list) return;

        let inbox = picker.querySelector('.fd-mobile-inbox');
        if (!inbox) {
          inbox = document.createElement('div');
          inbox.className = 'fd-mobile-inbox';
          inbox.setAttribute('aria-label', 'Conversations');
          picker.prepend(inbox);
        }

        const fragment = document.createDocumentFragment();
        let currentHeading = null;
        for (const child of Array.from(list.children)) {
          if (child.classList.contains('section-label')) {
            if (!child.hidden) currentHeading = child.textContent.trim();
            else currentHeading = null;
            continue;
          }
          if (!child.matches('.thread') || child.hidden || child.dataset.threadKey?.startsWith('matchup:')) continue;
          if (currentHeading) {
            const heading = document.createElement('div');
            heading.className = 'section-label';
            heading.textContent = currentHeading;
            fragment.appendChild(heading);
            currentHeading = null;
          }
          const clone = child.cloneNode(true);
          clone.removeAttribute('id');
          clone.addEventListener('click', () => {
            child.click();
            document.querySelector('.conversation')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
          });
          fragment.appendChild(clone);
        }
        inbox.replaceChildren(fragment);
      }

      function simplifyMessages() {
        simplifyThreadList();
        simplifyNativePicker();
        buildMobileInbox();
      }

      simplifyMessages();
      const list = document.querySelector('[data-thread-list]');
      if (list) new MutationObserver(simplifyMessages).observe(list, { childList: true, subtree: true });
    })();
  </script>
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

  let themed = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-messages-theme>${messagesThemeStyles}</style>\n</head>`)
    : html;
  if (/<\/body>/i.test(themed)) themed = themed.replace(/<\/body>/i, `${messagesSimplifierScript}\n</body>`);

  return new Response(themed, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
