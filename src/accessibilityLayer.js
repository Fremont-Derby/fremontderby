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

  const styled = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `<style data-fd-accessibility-layer>${accessibilityStyles}</style>\n</head>`)
    : html;

  return new Response(styled, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
