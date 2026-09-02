const REPLACEMENTS = [
  ['<button class="load" data-load type="submit" disabled>Load prizes</button>', ''],
  ["const loadButton = document.querySelector('[data-load]');\n", ''],
  ['      loadButton.disabled = true;\n', ''],
  ['      loadButton.disabled = false;\n', ''],
  ['        loadButton.disabled = seasonInput.disabled;\n', ''],
];

export function applyJflPrizesAutoloadHtml(html) {
  let next = String(html || '');
  for (const [from, to] of REPLACEMENTS) next = next.replaceAll(from, to);
  return next;
}

export async function applyJflPrizesAutoloadFix(response) {
  if (!response || !(response.headers.get('content-type') || '').includes('text/html')) {
    return response;
  }
  const html = applyJflPrizesAutoloadHtml(await response.text());
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
