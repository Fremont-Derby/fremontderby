export const accessibilityStyles = `
  :root {
    --fd-focus: #096238;
    --fd-placeholder: #666b68;
    --fd-shell-focus-inner: #06341f;
    --fd-shell-focus-outer: #ffffff;
  }

  /* Keep the light design language authoritative outside the intentionally dark navigation shell. */
  main figure,
  main .illustration,
  main [class*="illustration"],
  main [class*="artwork"],
  main [class*="graphic"] {
    background-color: var(--fd-bg-surface, #ffffff) !important;
    color: var(--fd-text, #171b19) !important;
  }

  /* The 404 predates the light-theme convergence. Keep the basset/pool art, not the dark page theme. */
  body:has(main.lost) {
    background: var(--fd-bg-page, #f3f1ed) !important;
    color: var(--fd-text, #171b19) !important;
  }
  main.lost {
    width: min(820px, calc(100% - 28px));
    margin: 0 auto;
    padding: clamp(24px, 6vw, 64px) 0 72px;
    color: var(--fd-text, #171b19) !important;
  }
  main.lost .hound {
    padding: clamp(12px, 3vw, 22px);
    border: 1px solid var(--fd-border, #d7d9d7);
    border-radius: var(--fd-radius, 16px);
    background: var(--fd-bg-surface, #ffffff) !important;
    box-shadow: var(--fd-shadow-soft, 0 3px 10px rgba(25,31,27,.08));
    filter: none !important;
  }
  main.lost .kicker { color: var(--fd-primary, #096238) !important; }
  main.lost h1 { color: var(--fd-text, #171b19) !important; }
  main.lost p { color: var(--fd-text-muted, #666b68) !important; }
  main.lost .path {
    color: var(--fd-text, #171b19) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.lost .actions a {
    color: var(--fd-primary-strong, #074a2b) !important;
    background: var(--fd-bg-surface, #ffffff) !important;
    border-color: var(--fd-border-control, #bfc5c1) !important;
  }
  main.lost .actions a.primary {
    color: var(--fd-primary-text, #ffffff) !important;
    background: var(--fd-primary-strong, #074a2b) !important;
    border-color: var(--fd-primary-strong, #074a2b) !important;
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--fd-placeholder) !important;
    opacity: 1 !important;
  }

  a:focus-visible,
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  summary:focus-visible,
  [role="button"]:focus-visible {
    outline: 3px solid var(--fd-focus) !important;
    outline-offset: 2px !important;
  }

  /* The shell needs a two-tone ring so focus remains visible on both felt and white active items. */
  .fd-shell a:focus-visible,
  .fd-shell button:focus-visible,
  .fd-shell summary:focus-visible {
    outline: 2px solid var(--fd-shell-focus-outer) !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 5px var(--fd-shell-focus-inner) !important;
  }

  /* State meaning must remain legible without relying on hue alone. */
  [data-state="error"],
  [data-tone="error"],
  [data-state="mismatch"] {
    text-decoration-thickness: max(1px, .08em);
  }

  /* Disabled controls must never hide their explanation in a tooltip alone. */
  .fd-disabled-reason {
    margin: 0;
    max-width: 32rem;
    color: var(--fd-text-muted, #4e5652);
    font-size: .78rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      scroll-behavior: auto !important;
      transition-duration: .01ms !important;
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
    }
  }

  @media (forced-colors: active) {
    .fd-shell,
    .fd-nav--mobile,
    .fd-message-preview,
    .fd-mobile-dock,
    .card,
    .panel,
    .state,
    .state-card,
    main.lost .hound,
    main.lost .path,
    main.lost .actions a,
    button,
    input,
    select,
    textarea {
      forced-color-adjust: auto !important;
    }

    a:focus-visible,
    button:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible,
    summary:focus-visible,
    [role="button"]:focus-visible {
      outline: 3px solid Highlight !important;
    }
  }
`;

export const accessibilityScript = `
(() => {
  let reasonSequence = 0;

  function reasonElementFor(control) {
    const id = control.getAttribute('data-fd-disabled-reason-id');
    return id ? document.getElementById(id) : null;
  }

  function removeReason(control) {
    const existing = reasonElementFor(control);
    if (existing) existing.remove();
    control.removeAttribute('data-fd-disabled-reason-id');
    const describedBy = (control.getAttribute('aria-describedby') || '')
      .split(/\\s+/)
      .filter(Boolean)
      .filter(id => !id.startsWith('fd-disabled-reason-'));
    if (describedBy.length) control.setAttribute('aria-describedby', describedBy.join(' '));
    else control.removeAttribute('aria-describedby');
  }

  function syncDisabledReason(control) {
    if (!(control instanceof HTMLElement)) return;
    const reason = (control.getAttribute('title') || '').trim();
    if (!control.matches(':disabled') || !reason) {
      removeReason(control);
      return;
    }

    let note = reasonElementFor(control);
    if (!note) {
      note = document.createElement('p');
      note.className = 'fd-disabled-reason';
      note.id = 'fd-disabled-reason-' + (++reasonSequence);
      note.setAttribute('role', 'note');
      control.insertAdjacentElement('afterend', note);
      control.setAttribute('data-fd-disabled-reason-id', note.id);
    }
    note.textContent = reason;
    const ids = new Set((control.getAttribute('aria-describedby') || '').split(/\\s+/).filter(Boolean));
    ids.add(note.id);
    control.setAttribute('aria-describedby', [...ids].join(' '));
  }

  function scan(root) {
    if (!(root instanceof Element || root instanceof Document)) return;
    if (root instanceof Element && root.matches('button[disabled][title],input[disabled][title],select[disabled][title]')) {
      syncDisabledReason(root);
    }
    for (const control of root.querySelectorAll('button[disabled][title],input[disabled][title],select[disabled][title]')) {
      syncDisabledReason(control);
    }
  }

  function start() {
    scan(document);
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') syncDisabledReason(record.target);
        for (const node of record.addedNodes) if (node instanceof Element) scan(node);
      }
    }).observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['disabled','title']});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
`;

export async function injectAccessibilityLayer(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  if (html.includes('data-fd-accessibility-layer')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  let enhanced = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-accessibility-layer>${accessibilityStyles}</style>\n</head>`)
    : html;
  enhanced = /<\/body>/i.test(enhanced)
    ? enhanced.replace(/<\/body>/i, `<script data-fd-disabled-reasons>${accessibilityScript}</script>\n</body>`)
    : enhanced;

  return new Response(enhanced, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
