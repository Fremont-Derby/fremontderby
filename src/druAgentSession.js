import { DRU_AGENT_SENTINEL, druAgentSentinelEnabled } from './supabaseAuth.js';

const MARKER = 'data-fd-dru-agent-session';

const agentSessionScript = `<script ${MARKER}>
(() => {
  const sentinel = ${JSON.stringify(DRU_AGENT_SENTINEL)};
  const keys = ['fd.accessToken'];
  try {
    const session = window.sessionStorage;
    const durable = window.localStorage;
    const current = session.getItem('fd.accessToken') || durable.getItem('fd.accessToken') || '';
    const looksLikeJwt = current.split('.').length === 3 && current.length > 40;
    if (!looksLikeJwt) {
      session.setItem('fd.accessToken', sentinel);
      try { durable.setItem('fd.accessToken', sentinel); } catch {}
    }
  } catch {}
  function hideGoogleWall() {
    const nodes = document.querySelectorAll('button, a, p, .banner, [role="status"]');
    for (const node of nodes) {
      const text = (node.textContent || '').trim();
      if (/^sign in with google$/i.test(text) || /^continue with google$/i.test(text)) {
        node.setAttribute('hidden', '');
      }
    }
    if (document.body && !document.querySelector('[data-fd-dru-actor-banner]')) {
      const banner = document.createElement('div');
      banner.setAttribute('data-fd-dru-actor-banner', '');
      banner.setAttribute('role', 'status');
      banner.style.cssText = 'margin:0;padding:8px 14px;background:#16321f;color:#d9ffe6;font:700 13px/1.4 system-ui,sans-serif';
      banner.textContent = 'DRU test actor is signed in for agent clicks. Google is not required on this lane.';
      document.body.prepend(banner);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideGoogleWall);
  } else {
    hideGoogleWall();
  }
})();
</script>`;

export async function injectDruAgentSession(response, env = {}) {
  if (!druAgentSentinelEnabled(env)) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  if (html.includes(MARKER)) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const withBootstrap = /<head(?:\s|>)/i.test(html)
    ? html.replace(/<head([^>]*)>/i, `<head$1>\n${agentSessionScript}`)
    : html.replace(/<body([^>]*)>/i, `${agentSessionScript}\n<body$1>`);

  return new Response(withBootstrap, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
