import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';

const OLD_PICKER = "requestedRound&&rounds.some((round)=>round.roundId===requestedRound))return requestedRound;";
const NEW_PICKER = "requestedRound&&rounds.some((round)=>round.roundId===requestedRound&&!['finalized','corrected'].includes(round.teamMatchStatus)))return requestedRound;";

export function repairLineupScript(html) {
  let out = String(html || '').replace(OLD_PICKER, NEW_PICKER);
  if (out.includes('data-next-match')) return out;
  out = out.replace('</header>', '</header><p data-next-match>Looking up your next published match…</p>');
  out = out.replace(
    '</body>',
    `<script>
      ${nextMatchSummaryBrowserSource}
      (()=>{const nextEl=document.querySelector('[data-next-match]');if(!nextEl)return;fetch('/api/me/matches',{headers:{accept:'application/json'}}).then((response)=>response.json()).then((body)=>{const next=pickNextMatch(body.matches||[]);nextEl.textContent=next?('Next match: '+nextMatchLabel(next)):'No upcoming match published.';}).catch(()=>{nextEl.textContent='Could not load matches.';});})();
    </script></body>`,
  );
  return out;
}
