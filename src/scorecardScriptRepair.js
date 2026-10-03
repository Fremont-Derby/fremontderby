import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';
import { scoreState } from './scoreState.js';
import { scorecardMatchLabel, seasonsForRequestedMatch } from './druScorecardSeason.js';

const OLD_HOOK = 'filtersEl.hidden=false;populateMatchups();selectRequestedMatch()}';
const SHORT_HOOK = 'populateMatchups();selectRequestedMatch()}';
const NEW_HOOK = 'populateMatchups();selectRequestedMatch();void honorRequestedMatchDate();void openDruSeason()}';
const MATCH_ONLY = "const requestedMatch=new URLSearchParams(location.search).get('match')||'';";
const MATCH_OR_TEAM = "const requestedMatch=new URLSearchParams(location.search).get('match')||new URLSearchParams(location.search).get('teamMatchId')||'';";
const HONOR_FN = "function honorRequestedMatchDate(){if(!requestedMatch||requestedContext())return Promise.resolve();const requestedSeason=new URLSearchParams(location.search).get('season')||'';return fetch('/api/seasons').then((response)=>response.text().then((text)=>response.ok&&!text.trim().startsWith('<')?JSON.parse(text):{seasons:[]})).then((body)=>{const seasons=(typeof seasonsForRequestedMatch==='function'?seasonsForRequestedMatch:function(rows,explicitId){const list=rows||[];return list.filter((season)=>season.id===explicitId).concat(list.filter((season)=>season.id!==explicitId))})(body.seasons||[],requestedSeason);const load=(index)=>{const season=seasons[index];if(!season)return null;return fetch('/api/seasons/'+encodeURIComponent(season.id)+'/schedule').then((response)=>response.text().then((text)=>response.ok&&!text.trim().startsWith('<')?JSON.parse(text):{rounds:[]})).then((schedule)=>{const rounds=schedule.rounds||[];for(const round of rounds){const match=(round.matches||[]).find((item)=>item.teamMatchId===requestedMatch);if(!match)continue;const date=round.scheduledOn||round.scheduled_on||'';if(date&&!Array.from(dateSelect.options).some((option)=>option.value===date)){const option=document.createElement('option');option.value=date;option.textContent=dateLabel(date);dateSelect.append(option)}if(date)dateSelect.value=date;populateMatchups();if(!Array.from(matchupSelect.options).some((option)=>option.value===requestedMatch)){const option=document.createElement('option');option.value=requestedMatch;option.textContent=(match.teamAName||'Home')+' vs '+(match.teamBName||'Away')+' \u00b7 Round '+(round.roundNumber||'');matchupSelect.append(option)}matchupSelect.value=requestedMatch;populateRaces();setStatus('Opened '+(match.teamAName||'Home')+' vs '+(match.teamBName||'Away')+(match.winnerTeamName?'. Champion: '+match.winnerTeamName:'')+'.');return}return load(index+1)})};return load(0)}).catch(()=>{})}";

export function druScorecardSeasonPickerSource() {
  return `(()=>{\n    const dateSelect=document.querySelector('[data-date]');\n    const matchupSelect=document.querySelector('[data-matchup]');\n    if(!dateSelect||!matchupSelect||document.querySelector('[data-dru-season]'))return;\n    const label=document.createElement('label');\n    label.textContent='Season ';\n    const select=document.createElement('select');\n    select.setAttribute('data-dru-season','');\n    label.append(select);\n    dateSelect.parentElement.insertBefore(label, dateSelect);\n    const requested=new URLSearchParams(location.search).get('season')||'';\n    function addMatch(round, match){\n      if(!match.teamMatchId||Array.from(matchupSelect.options).some((option)=>option.value===match.teamMatchId))return;\n      const option=document.createElement('option');\n      option.value=match.teamMatchId;\n      option.textContent=(match.teamAName||'Home')+' vs '+(match.teamBName||'Away')+' \u00b7 Round '+(round.roundNumber||'');\n      option.dataset.date=round.scheduledOn||'';\n      matchupSelect.append(option);\n    }\n    function load(seasonId){\n      if(!seasonId)return;\n      fetch('/api/seasons/'+encodeURIComponent(seasonId)+'/schedule',{headers:{accept:'application/json'}})\n        .then((response)=>response.json())\n        .then((body)=>{\n          for(const round of body.rounds||[]) for(const match of round.matches||[]) addMatch(round, match);\n          const requestedMatch=new URLSearchParams(location.search).get('match')||new URLSearchParams(location.search).get('teamMatchId')||'';\n          if(requestedMatch&&Array.from(matchupSelect.options).some((option)=>option.value===requestedMatch)) matchupSelect.value=requestedMatch;\n        }).catch(()=>{});\n    }\n    fetch('/api/seasons',{headers:{accept:'application/json'}}).then((response)=>response.json()).then((body)=>{\n      for(const season of body.seasons||[]){\n        const option=document.createElement('option');\n        option.value=season.id;\n        option.textContent=season.name+' \u00b7 '+season.status;\n        select.append(option);\n      }\n      if(requested){select.value=requested;load(requested);}\n    }).catch(()=>{});\n    select.addEventListener('change',()=>load(select.value));\n  })();`;
}

export function repairScorecardScript(html) {
  let next = String(html || '');
  if (!next.includes('function honorRequestedMatchDate')) {
    next = next.replace('function selectRequestedMatch()', HONOR_FN + 'function selectRequestedMatch()');
  }
  next = next.replace(OLD_HOOK, NEW_HOOK);
  next = next.replace(SHORT_HOOK, NEW_HOOK);
  next = next.replace(MATCH_ONLY, MATCH_OR_TEAM);
  if (!next.includes('function openDruSeason')) {
    next = next.replace('function selectRequestedMatch()', 'function openDruSeason(){' + druScorecardSeasonPickerSource() + '}function selectRequestedMatch()');
  }
  if (!next.includes('data-score-state')) next = next.replace('</header>', '</header><p data-score-state>'+scoreState({ empty: true }).text+'</p>');
  if (next.includes('data-next-match')) return next;
  next = next.replace('</header>', '</header><p data-next-match>Looking up your next published match\u2026</p>');
  next = next.replace(
    '</body>',
    `<script>\n      ${nextMatchSummaryBrowserSource}\n      (()=>{const nextEl=document.querySelector('[data-next-match]');if(!nextEl)return;fetch('/api/me/matches',{headers:{accept:'application/json'}}).then((response)=>response.text().then((text)=>response.ok&&!text.trim().startsWith('<')?JSON.parse(text):{matches:[]})).then((body)=>{const next=pickNextMatch(body.matches||[]);nextEl.textContent=next?('Next match: '+nextMatchLabel(next)):'No upcoming match published.';}).catch(()=>{nextEl.textContent='Could not load matches.';});})();\n    </script></body>`,
  );
  return next;
}

export { scorecardMatchLabel, seasonsForRequestedMatch };
