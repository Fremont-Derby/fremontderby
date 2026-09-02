const REPLACEMENTS = [
  [
    '.layout { min-height: min(720px, calc(100vh - 160px));',
    '.layout { height: min(720px, calc(100vh - 160px)); max-height: calc(100vh - 160px); min-height: 0;',
  ],
  [
    '.threads { border-right: 1px solid var(--line); background: #081a12; }',
    '.threads { min-height: 0; overflow: hidden; display: grid; grid-template-rows: auto auto minmax(0, 1fr); border-right: 1px solid var(--line); background: #081a12; }',
  ],
  [
    '.thread-list { display: grid; gap: 4px; padding: 8px; }',
    '.thread-list { min-height: 0; overflow-y: auto; overscroll-behavior: contain; display: grid; gap: 4px; padding: 8px; }',
  ],
  [
    '.chat { min-width: 0; display: grid; grid-template-rows: auto minmax(260px, 1fr) auto; }',
    '.chat { min-width: 0; min-height: 0; height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; }',
  ],
  [
    '.message-list { min-height: 0; overflow-y: auto; overscroll-behavior: contain; display: flex;',
    '.message-list { min-height: 0; overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; display: flex;',
  ],
  [
    '.layout { min-height: calc(100dvh - 175px); grid-template-columns: 1fr; }',
    '.layout { height: calc(100dvh - 175px); max-height: calc(100dvh - 175px); min-height: 0; grid-template-columns: 1fr; }',
  ],
  [
    '.chat { grid-template-rows: auto auto minmax(260px, 1fr) auto; }',
    '.chat { grid-template-rows: auto auto minmax(0, 1fr) auto; }',
  ],
];

export function applyJflChatScrollCss(html) {
  let next = String(html || '');
  for (const [from, to] of REPLACEMENTS) {
    next = next.replace(from, to);
  }
  return next;
}

export async function applyJflChatScrollFix(response) {
  if (!response || !(response.headers.get('content-type') || '').includes('text/html')) {
    return response;
  }
  const html = applyJflChatScrollCss(await response.text());
  const headers = new Headers(response.headers);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
