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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      return htmlResponse(renderIntroPage());
    }

    if (request.method === 'GET' && url.pathname === '/rules') {
      return htmlResponse(renderRulesPage());
    }

    return app.fetch(request, env, ctx);
  },
};
