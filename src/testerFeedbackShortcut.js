export function testerFeedbackScript() {
  return `(() => {
    if (document.querySelector('[data-tester-feedback]')) return;
    const link = document.createElement('a');
    link.dataset.testerFeedback = '1';
    link.textContent = 'Report a problem';
    link.href = '/health';
    link.style.cssText = 'position:fixed;right:12px;bottom:72px;z-index:30;font-size:.8rem';
    document.body.append(link);
    fetch('/health', { headers: { accept: 'application/json' } })
      .then((response) => response.json())
      .then((body) => {
        const sha = body.versionTag || body.version || 'unknown';
        const route = location.pathname;
        link.href = 'mailto:ops@fremontderby.com?subject=' + encodeURIComponent('Tester report ' + route)
          + '&body=' + encodeURIComponent('environment=dru\\nversion=' + sha + '\\nroute=' + route + '\\n\\nWhat happened:\\n');
      })
      .catch(() => {});
  })();`;
}

export async function injectTesterFeedback(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  let html = await response.text();
  if (html.includes('data-tester-feedback-script')) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }
  if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `<script data-tester-feedback-script>${testerFeedbackScript()}</script>\n</body>`);
  }
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
