export async function enhanceJflQaResults(response, env) {
  if (env?.ENVIRONMENT !== 'jfl' || !response.headers.get('content-type')?.includes('text/html')) return response;
  const section = `<section data-qa-results hidden aria-label="Private QA matchup results"><h2>QA matchup results</h2><p data-qa-result-state role="status"></p><p data-qa-team-result></p><table><caption>Saved player race results</caption><thead><tr><th>Pairing</th><th>Team A racks</th><th>Team B racks</th><th>Status</th></tr></thead><tbody data-qa-result-races></tbody></table><button type="button" data-qa-result-refresh>Refresh results</button><p>Private synthetic matchup. Race wins are not season standings points.</p></section>`;
  const script = `<script>
    (()=>{const box=document.querySelector('[data-qa-results]');
    async function load(){const token=sessionStorage.getItem('fd.accessToken');if(!token)return;
      const status=box.querySelector('[data-qa-result-state]');
      try{const response=await fetch('/api/me/jfl-qa-results',{headers:{authorization:'Bearer '+token}});
      if(response.status===401||response.status===403||response.status===404){box.hidden=true;return}
      box.hidden=false;if(!response.ok){status.textContent='Results temporarily unavailable. Try Refresh results.';return}
      const data=await response.json();status.textContent=data.result.label;
      box.querySelector('[data-qa-team-result]').textContent=data.result.state==='complete'?'Team '+data.result.winnerSide.toUpperCase()+' wins '+data.result.winsA+'–'+data.result.winsB:'Matchup not complete. No team winner yet.';
      const body=box.querySelector('[data-qa-result-races]');body.replaceChildren();
      for(const race of data.races){const tr=document.createElement('tr');for(const value of ['Pairing '+race.slotNumber+' · '+race.playerAName+' vs '+race.playerBName,race.scoreA??'—',race.scoreB??'—',race.status]){const td=document.createElement('td');td.textContent=String(value);tr.append(td)}body.append(tr)}
      }catch{box.hidden=false;status.textContent='Results temporarily unavailable. Try Refresh results.'}}
    box.querySelector('[data-qa-result-refresh]').addEventListener('click',load);load();})();
  </script>`;
  const html = (await response.text()).replace('</main>', `${section}</main>`).replace('</body>', `${script}</body>`);
  const headers = new Headers(response.headers); headers.set('cache-control', 'no-store');
  return new Response(html, { status: response.status, headers });
}
