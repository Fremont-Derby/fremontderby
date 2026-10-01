import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';
import { scorecardMatchLabel, seasonsForRequestedMatch } from './druScorecardSeason.js';

const OLD_HOOK = 'filtersEl.hidden=false;populateMatchups();selectRequestedMatch()}';
const NEW_HOOK = 'filtersEl.hidden=false;populateMatchups();selectRequestedMatch();void honorRequestedMatchDate()}';
const HONOR_FN = "function honorRequestedMatchDate(){if(!requestedMatch||requestedContext())return Promise.resolve();const requestedSeason=new URLSearchParams(location.search).get('season')||'';return fetch('/api/seasons').then((response)=>response.text().then((text)=>response.ok&&!text.trim().startsWith('<')?JSON.parse(text):{seasons:[]})).then((body)=>{const seasons=(typeof seasonsForRequestedMatch==='function'?seasonsForRequestedMatch:function(rows,explicitId){const list=rows||[];return list.filter((season)=>season.id===explicitId).concat(list.filter((season)=>season.id!==explicitId))})(body.seasons||[],requestedSeason);const load=(index)=>{const season=seasons[index];if(!season)return null;return fetch('/api/seasons/'+encodeURIComponent(season.id)+'/schedule').then((response)=>response.text().then((text)=>response.ok&&!text.trim().startsWith('<')?JSON.parse(text):{rounds:[]})).then((schedule)=>{const rounds=schedule.rounds||[];for(const round of rounds){const match=(round.matches||[]).find((item)=>item.teamMatchId===requestedMatch);if(!match)continue;const date=round.scheduledOn||round.scheduled_on||'';if(date&&!Array.from(dateSelect.options).some((option)=>option.value===date)){const option=document.createElement('option');option.value=date;option.textContent=dateLabel(date);dateSelect.append(option)}if(date)dateSelect.value=date;populateMatchups();if(!Array.from(matchupSelect.options).some((option)=>option.value===requestedMatch)){const option=document.createElement('option');option.value=requestedMatch;option.textContent=(match.teamAName||'Home')+' vs '+(match.teamBName||'Away')+' · Round '+(round.roundNumber||'');matchupSelect.append(option)}matchupSelect.value=requestedMatch;populateRaces();setStatus('Opened '+(match.teamAName||'Home')+' vs '+(match.teamBName||'Away')+'.');return}return load(index+1)})};return load(0)}).catch(()=>{})}";

export function druScorecardSeasonPickerSource() {
  return `(()=>{
    const dateSelect=document.querySelector('[data-date]');
    const matchupSelect=document.querySelector('[data-matchup]');
    if(!dateSelect||!matchupSelect||document.querySelector('[data-dru-season]'))return;
    const label=document.createElement('label');
    label.textContent='Season ';
    const select=document.createElement('select');
    select.setAttribute('data-dru-season','');
    label.append(select);
    dateSelect.parentElement.insertBefore(label, dateSelect);
    const requested=new URLSearchParams(location.search).get('season')||'';
    function addMatch(round, match){
      if(!match.teamMatchId||Array.from(matchupSelect.options).some((option)=>option.value===match.teamMatchId))return;
      const option=document.createElement('option');
      option.value=match.teamMatchId;
      option.textContent=(match.teamAName||'Home')+' vs '+(match.teamBName||'Away')+' · Round '+(round.roundNumber||'');
      option.dataset.date=round.scheduledOn||'';
      matchupSelect.append(option);
    }
    function load(seasonId){
      if(!seasonId)return;
      fetch('/api/seasons/'+encodeURIComponent(seasonId)+'/schedule',{headers:{accept:'application/json'}})
        .then((response)=>response.json())
        .then((body)=>{
          for(const round of body.rounds||[]) for(const match of round.matches||[]) addMatch(round, match);
          const requestedMatch=new URLSearchParams(location.search).get('match')||'';
          if(requestedMatch&&Array.from(matchupSelect.options).some((option)=>option.value===requestedMatch)) matchupSelect.value=requestedMatch;
        }).catch(()=>{});
    }
    fetch('/api/seasons',{headers:{accept:'application/json'}}).then((response)=>response.json()).then((body)=>{
      for(const season of body.seasons||[]){
        const option=document.createElement('option');
        option.value=season.id;
        option.textContent=season.name+' · '+season.status;
        select.append(option);
      }
      if(requested){select.value=requested;load(requested);}
    }).catch(()=>{});
    select.addEventListener('change',()=>load(select.value));
  })();`;
}

export function repairScorecardScript(html) {
  let next = String(html || '');
  if (!next.includes('function honorRequestedMatchDate')) {
    next = next.replace('function selectRequestedMatch()', HONOR_FN + 'function selectRequestedMatch()');
  }
  next = next.replace(OLD_HOOK, NEW_HOOK);
  if (!next.includes('data-dru-season-picker')) {
    next = next.replace(
      '</body>',
      `<script data-dru-season-picker>\n${druScorecardSeasonPickerSource()}\n</script></body>`,
    );
  }
  if (next.includes('data-next-match')) return next;
  next = next.replace('</header>', '</header><p data-next-match>Looking up your next published match…</p>');
  next = next.replace(
    '</body>',
    `<script>\n      ${nextMatchSummaryBrowserSource}\n      (()=>{const nextEl=document.querySelector('[data-next-match]');if(!nextEl)return;fetch('/api/me/matches',{headers:{accept:'application/json'}}).then((response)=>response.text().then((text)=>response.ok&&!text.trim().startsWith('<')?JSON.parse(text):{matches:[]})).then((body)=>{const next=pickNextMatch(body.matches||[]);nextEl.textContent=next?('Next match: '+nextMatchLabel(next)):'No upcoming match published.';}).catch(()=>{nextEl.textContent='Could not load matches.';});})();\n    </script></body>`,
  );
  return next;
}

export { scorecardMatchLabel, seasonsForRequestedMatch };
