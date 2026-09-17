import { nextMatchSummaryBrowserSource } from './nextMatchSummary.js';

const OLD_PICKER = "const requestedContext=contexts.find((context)=>context.roundId===requested);if(requestedContext)contextSelect.value=contextKey(requestedContext);else if(remembered&&contexts.some((context)=>contextKey(context)===remembered))contextSelect.value=remembered;";
const NEW_PICKER = "const startOfToday=new Date();startOfToday.setHours(0,0,0,0);const upcoming=contexts.find((context)=>Number.isFinite(Date.parse(context.scheduledOn))&&Date.parse(context.scheduledOn)>=startOfToday.getTime());const requestedContext=contexts.find((context)=>context.roundId===requested);if(requestedContext)contextSelect.value=contextKey(requestedContext);else if(upcoming)contextSelect.value=contextKey(upcoming);else if(remembered&&contexts.some((context)=>contextKey(context)===remembered))contextSelect.value=remembered;";

export function repairAvailabilityScript(html) {
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
