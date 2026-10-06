import { decorateHtmlWithShell } from './appShell.js';

export function publicPlayoffRounds(rounds = []) {
  return (Array.isArray(rounds) ? rounds : [])
    .filter((round) => ['semifinal', 'championship'].includes(String(round?.stage || '').toLowerCase()))
    .map((round) => ({
      stage: String(round.stage).toLowerCase(),
      date: String(round.scheduledOn || ''),
      status: String(round.status || 'scheduled'),
      matches: (Array.isArray(round.matches) ? round.matches : []).map((match) => {
        const final = ['finalized', 'corrected'].includes(String(match?.status || ''));
        const scoreA = Number(match?.teamAScore);
        const scoreB = Number(match?.teamBScore);
        const anchor = match?.anchorTiebreaker;
        return {
          teamA: String(match?.teamAName || 'Team to be determined'),
          teamB: String(match?.teamBName || 'Team to be determined'),
          status: String(match?.status || 'scheduled'),
          scoreA: final && Number.isFinite(scoreA) ? scoreA : null,
          scoreB: final && Number.isFinite(scoreB) ? scoreB : null,
          winner: final && Number.isFinite(scoreA) && Number.isFinite(scoreB) && scoreA !== scoreB
            ? String(scoreA > scoreB ? match?.teamAName : match?.teamBName) : null,
          anchor: anchor ? {
            playerA: String(anchor.playerAName || 'Anchor A'),
            playerB: String(anchor.playerBName || 'Anchor B'),
            scoreA: Number.isFinite(Number(anchor.scoreA)) ? Number(anchor.scoreA) : null,
            scoreB: Number.isFinite(Number(anchor.scoreB)) ? Number(anchor.scoreB) : null,
            status: String(anchor.status || 'scheduled'),
          } : null,
        };
      }),
    }))
    .sort((a, b) => (a.stage === 'semifinal' ? 0 : 1) - (b.stage === 'semifinal' ? 0 : 1)
      || a.date.localeCompare(b.date));
}

const styles = `<style>
  .fd-playoffs{width:min(100% - 32px,960px);margin:0 auto;padding:28px 0 110px;color:#14231a}
  .fd-playoffs h1{margin:0 0 8px;font-size:clamp(2rem,6vw,3.2rem)}
  .fd-playoffs p{line-height:1.5;color:#415348}
  .fd-playoffs__control{display:grid;gap:6px;max-width:360px;margin:20px 0;font-weight:800}
  .fd-playoffs select{min-height:46px;padding:8px 10px;border:1px solid #718d77;border-radius:8px;background:#fff;color:#14231a;font:inherit}
  .fd-playoffs__rounds{display:grid;gap:18px}.fd-playoffs__round{padding:16px;border:1px solid #b6c9bc;border-radius:14px;background:#fff}
  .fd-playoffs__round h2{margin:0 0 5px}.fd-playoffs__matches{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px;list-style:none;padding:0;margin:14px 0 0}
  .fd-playoffs__match{padding:15px;border:1px solid #b6c9bc;border-radius:12px;background:#f4faf5}
  .fd-playoffs__team{display:flex;justify-content:space-between;gap:12px;font-weight:800;overflow-wrap:anywhere}
  .fd-playoffs__team+.fd-playoffs__team{margin-top:8px}.fd-playoffs__winner{margin:12px 0 0!important;font-weight:800;color:#145c35!important}
  .fd-playoffs__anchor{margin:12px 0 0!important;padding-top:10px;border-top:1px solid #b6c9bc}
  .fd-playoffs__status[data-tone=error]{color:#9a241b}.fd-playoffs__empty{padding:20px;border:1px dashed #718d77;border-radius:12px;background:#fff}
  .fd-playoffs [hidden]{display:none!important}.fd-playoffs :is(a,select,button):focus-visible{outline:3px solid #1f7a52;outline-offset:3px}
</style>`;

const script = `<script>
(() => {
  const project = (${publicPlayoffRounds.toString()});
  const root=document.querySelector('[data-public-playoffs]');
  const season=root.querySelector('[data-season]');
  const rounds=root.querySelector('[data-rounds]');
  const empty=root.querySelector('[data-empty]');
  const status=root.querySelector('[data-status]');
  let requestNumber=0;
  function state(message,tone='muted'){status.textContent=message;status.dataset.tone=tone}
  async function getJson(path){const response=await fetch(path);if(!response.ok)throw new Error('Postseason data is unavailable.');return response.json()}
  function addText(parent,tag,value,className){const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;parent.append(el);return el}
  function render(data){
    rounds.replaceChildren();empty.hidden=data.length>0;
    if(!data.length){state('No postseason bracket is published for this season yet.');return}
    for(const round of data){
      const section=document.createElement('section');section.className='fd-playoffs__round';
      addText(section,'h2',round.stage==='semifinal'?'Semifinals':'Championship');
      addText(section,'p',[round.date,round.status.replaceAll('_',' ')].filter(Boolean).join(' · '));
      const list=document.createElement('ul');list.className='fd-playoffs__matches';
      for(const match of round.matches){
        const card=document.createElement('li');card.className='fd-playoffs__match';
        for(const [name,score] of [[match.teamA,match.scoreA],[match.teamB,match.scoreB]]){
          const row=document.createElement('div');row.className='fd-playoffs__team';
          addText(row,'span',name);addText(row,'span',score===null?'—':String(score));card.append(row);
        }
        addText(card,'p',match.winner?'Winner: '+match.winner:'Match '+match.status.replaceAll('_',' '),match.winner?'fd-playoffs__winner':'');
        if(match.anchor){const a=match.anchor;const result=a.scoreA===null||a.scoreB===null?'pending':a.scoreA+'–'+a.scoreB;
          addText(card,'p','Anchor tiebreaker: '+a.playerA+' vs '+a.playerB+' · '+result+' · '+a.status.replaceAll('_',' '),'fd-playoffs__anchor');}
        list.append(card);
      }
      section.append(list);rounds.append(section);
    }
    state(data.length+' postseason round'+(data.length===1?'':'s'),'ok');
  }
  async function load(){
    const id=season.value;const request=++requestNumber;
    if(!id){render([]);return}
    state('Loading bracket…');
    try{const body=await getJson('/api/seasons/'+encodeURIComponent(id)+'/schedule');if(request!==requestNumber)return;render(project(body.rounds));
      try{localStorage.setItem('fd.playoffsSeasonId',id)}catch{}
    }catch{if(request!==requestNumber)return;rounds.replaceChildren();empty.hidden=true;state('Postseason data is unavailable. Try again.','error')}
  }
  async function boot(){
    state('Loading seasons…');
    try{const body=await getJson('/api/seasons');const seasons=Array.isArray(body.seasons)?body.seasons:[];season.replaceChildren();
      for(const item of seasons){const option=document.createElement('option');option.value=item.id;option.textContent=item.name+' — '+item.status;season.append(option)}
      let remembered='';try{remembered=localStorage.getItem('fd.playoffsSeasonId')||''}catch{}
      const preferred=seasons.find(item=>item.id===remembered)||seasons.find(item=>item.status==='playoffs')||seasons.find(item=>item.status==='complete')||seasons[0];
      if(preferred)season.value=preferred.id;await load();
    }catch{state('Postseason data is unavailable. Try again.','error')}
  }
  season.addEventListener('change',load);root.querySelector('[data-retry]').addEventListener('click',boot);boot();
})();
</script>`;

export function renderJflPublicPlayoffs() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Playoffs · Fremont Derby</title>${styles}</head><body>
  <main class="fd-playoffs" data-public-playoffs><h1>Playoffs</h1><p>Follow semifinal and championship matchups from the official season schedule. Each postseason team uses four scheduled player matches; a declared anchor tiebreaker decides a 2–2 tie without replacing those results.</p>
    <label class="fd-playoffs__control">Season<select data-season aria-label="Season"></select></label>
    <p class="fd-playoffs__status" data-status role="status" aria-live="polite">Loading seasons…</p><button type="button" data-retry>Retry</button>
    <div class="fd-playoffs__rounds" data-rounds></div><div class="fd-playoffs__empty" data-empty hidden>No postseason bracket is published for this season yet. <a href="/schedule">View schedule</a></div>
  </main>${script}</body></html>`;
  return decorateHtmlWithShell(html, '/playoffs');
}

export function routeJflPublicPlayoffs(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl' || new URL(request.url).pathname !== '/playoffs') return null;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  return new Response(renderJflPublicPlayoffs(), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
