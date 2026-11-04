const PLAYER_NEXT_MATCH_PREVIEW = '<a class="secondary" href="/qa/mission/preview?mission=player.find-next-match">Preview randomized mission</a>';
const PLAYER_NEXT_MATCH_START = '<a class="primary" href="/qa/mission/start?mission=player.find-next-match">Start mission</a>';
const FIXTURE_PREVIEW_LINK = /<a class="secondary" href="\/qa\/mission\/preview\?mission=([^"]+)">Preview randomized mission<\/a>/g;

const PLAYABLE_CARDS = [
  {
    missionId: 'player.find-next-match',
    marker: 'Find when and where you play next, and who your team faces.',
    href: '/qa/mission/start?mission=player.find-next-match',
  },
  {
    missionId: 'player.mark-availability',
    marker: 'Mark whether you can play in the upcoming match.',
    href: '/qa/mission/start?mission=player.mark-availability',
  },
  {
    missionId: 'captain.add-players',
    marker: 'Add the correct new players to your team.',
    href: '/qa/captain-add-players/start',
  },
];

function comingSoonButton() {
  return '<button type="button" disabled title="This mission is not playable yet">Coming soon</button>';
}

function promotePlayableCards(html) {
  return html.replace(/<article\b[^>]*class="[^"]*\bmission\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi, (card) => {
    const playable = PLAYABLE_CARDS.find((item) => card.includes(item.marker));
    if (!playable) return card;

    const withIdentity = card.replace('<article', `<article data-mission-id="${playable.missionId}"`);
    const withStatus = withIdentity.replace(/\bCOMING (?:SOON|NEXT)\b/i, 'PLAYABLE');
    if (withStatus.includes(playable.href)) return withStatus;

    return withStatus.replace(
      /<button\b[^>]*\bdisabled\b[^>]*>\s*Coming (?:next|soon)\s*<\/button>/i,
      `<a class="primary" href="${playable.href}">Start mission</a>`,
    );
  });
}

export async function enhanceQaMissionGameUx(response, request, env = {}) {
  if (!response || env.ENVIRONMENT !== 'jfl') return response;

  const url = new URL(request.url);
  if (url.pathname !== '/qa') return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  if (!html.includes('JFL HUMAN QA · PERSONA MISSIONS')) return new Response(html, response);

  const cleaned = html
    .replace(PLAYER_NEXT_MATCH_PREVIEW, PLAYER_NEXT_MATCH_START)
    .replaceAll('FIXTURE READY', 'COMING SOON')
    .replace(FIXTURE_PREVIEW_LINK, comingSoonButton())
    .replace(/<div class="build">Build <code>[^<]*<\/code><\/div>/, '')
    .replace(
      'Fresh runs use seeded randomized data. Playable missions exercise the QA product fixture; “fixture ready” means the randomized Arrange contract exists but product integration is intentionally not faked yet.',
      'Playable missions use fresh randomized test data and the real Fremont Derby experience. Missions that are not ready stay locked until they are genuinely playable.',
    );

  const campaign = promotePlayableCards(cleaned).replace('</head>', `<style>.qa-last-result{margin-top:9px;padding:8px 10px;border-radius:9px;background:#eef5f1;font-size:.72rem;font-weight:850;color:#29543b}.qa-last-result[data-outcome="fail"]{background:#fff0f0;color:#842626}.qa-last-result small{font-weight:700;color:inherit}</style></head>`).replace('</body>', `<script>
(() => {
  const resultsKey='fd.qa.persona.results.v1',pendingKey='fd.qa.evidence.pending.v1';
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
  function writePending(rows){localStorage.setItem(pendingKey,JSON.stringify(rows.slice(-100)))}
  function writeResults(rows){localStorage.setItem(resultsKey,JSON.stringify(rows.slice(-100)))}
  function render(){
    const rows=read(resultsKey,[]);
    for(const card of document.querySelectorAll('[data-mission-id]')){
      card.querySelector('.qa-last-result')?.remove();
      const missionId=card.dataset.missionId;
      const row=[...rows].reverse().find(item=>item.missionId===missionId);
      if(!row)continue;
      const badge=document.createElement('div');
      badge.className='qa-last-result';badge.dataset.outcome=row.outcome;
      badge.textContent='Last run: '+String(row.outcome||'').toUpperCase()+' · '+(row.saveState==='saved'?'feedback saved':'feedback queued');
      card.appendChild(badge);
    }
  }
  async function flush(){
    const pending=read(pendingKey,[]);
    if(!pending.length){render();return}
    let remaining=[...pending],results=read(resultsKey,[]);
    for(const row of pending){
      try{
        const response=await fetch('/api/qa/evidence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(row)});
        if(!response.ok)continue;
        remaining=remaining.filter(item=>item.run_id!==row.run_id);
        results=results.map(item=>item.runId===row.run_id?{...item,saveState:'saved'}:item);
      }catch{}
    }
    writePending(remaining);writeResults(results);render();
  }
  render();flush();
})();
</script></body>`);
  return new Response(campaign, response);
}
