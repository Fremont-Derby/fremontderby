import app from './index.js';
import { renderIntroPage, renderRulesPage } from './publicPages.js';

function htmlResponse(html) {
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function faviconResponse() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Fremont Derby"><rect width="64" height="64" rx="14" fill="#07150f"/><circle cx="32" cy="32" r="22" fill="#e7f2eb"/><circle cx="32" cy="32" r="15" fill="#173f2a"/><path d="M23 39V23h19v6H30v4h10v6H30v6h-7Z" fill="#f4f7f5"/></svg>`;
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/favicon.svg') {
      return faviconResponse();
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return htmlResponse(renderIntroPage());
    }

    if (request.method === 'GET' && url.pathname === '/rules') {
      return htmlResponse(renderRulesPage());
    }

    return app.fetch(request, env, ctx);
  },
};
