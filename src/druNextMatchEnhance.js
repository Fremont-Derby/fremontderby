import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';

const NEXT_MATCH_PATHS = new Set(['/messages']);

function injectNextMatch(html) {
  if (html.includes('data-next-match')) return html;
  if (html.includes('</header>')) {
    html = html.replace('</header>', '</header><p data-next-match>Looking up your next published match…</p>');
  } else if (html.includes('<main')) {
    html = html.replace(/<main\b[^>]*>/, (open) => `${open}<p data-next-match>Looking up your next published match…</p>`);
  }
  if (!html.includes('</body>')) return html;
  return html.replace(
    '</body>',
    `<script>
      ${nextMatchSummaryBrowserSource}
      (()=>{const nextEl=document.querySelector('[data-next-match]');if(!nextEl)return;fetch('/api/me/matches',{headers:{accept:'application/json'}}).then((response)=>response.json()).then((body)=>{const next=pickNextMatch(body.matches||[]);nextEl.textContent=next?('Next match: '+nextMatchLabel(next)):'No upcoming match published.';}).catch(()=>{nextEl.textContent='Could not load matches.';});})();
    </script></body>`,
  );
}

export async function enhanceDruNextMatch(response, pathname) {
  if (!NEXT_MATCH_PATHS.has(pathname)) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const html = injectNextMatch(await response.text());
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
