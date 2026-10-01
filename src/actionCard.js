/** #204 Present recommendations as action cards (shared shape). */
export function actionCard({ title, body, href, cta = 'Open' }) {
  return {
    title: String(title || ''),
    body: String(body || ''),
    href: href || null,
    cta: String(cta || 'Open'),
  };
}

export function renderActionCardHtml(card) {
  const c = actionCard(card);
  const link = c.href
    ? `<a href="${c.href}" style="min-height:44px;display:inline-flex;align-items:center">${c.cta} →</a>`
    : '';
  return `<article class="panel action-card"><strong>${c.title}</strong><p class="muted">${c.body}</p>${link}</article>`;
}
