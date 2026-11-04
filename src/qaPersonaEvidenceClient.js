function js(value) {
  return JSON.stringify(value);
}

export function renderPersonaEvidenceScript({
  missionId,
  seed,
  buildSha,
  assertionIds,
  fixtureFacts,
  reached,
}) {
  return `<script>
(() => {
  const mission=${js(missionId)},seed=${js(seed)},build=${js(buildSha)},assertionIds=${js(assertionIds)},fixtureFacts=${js(fixtureFacts)};
  const reached=${reached ? 'true' : 'false'};
  const pendingKey='fd.qa.evidence.pending.v1',testerKey='fd.qa.evidence.tester.v1',resultsKey='fd.qa.persona.results.v1',startedKey='fd.qa.persona.started.'+mission+'.'+seed;
  const buttons=[...document.querySelectorAll('[data-check]')],finish=document.querySelector('[data-finish]'),outcome=document.querySelector('[data-outcome]');
  function id(){return crypto.randomUUID?crypto.randomUUID():(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2))}
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
  function tester(){let value=localStorage.getItem(testerKey);if(!value){value=id();localStorage.setItem(testerKey,value)}return value}
  function device(){const ua=navigator.userAgent||'';return{browser_family:/Firefox/i.test(ua)?'firefox':/Edg/i.test(ua)?'edge':/Chrome/i.test(ua)?'chrome':/Safari/i.test(ua)?'safari':'other',device_family:/Android/i.test(ua)?'android':/iPhone|iPad/i.test(ua)?'ios':'desktop',viewport_width:window.innerWidth,viewport_height:window.innerHeight}}
  function writePending(rows){localStorage.setItem(pendingKey,JSON.stringify(rows.slice(-100)))}
  function selected(index){return buttons.find(button=>button.dataset.check===String(index)&&button.getAttribute('aria-pressed')==='true')}
  function saveSummary(summary){const rows=read(resultsKey,[]).filter(row=>row.runId!==summary.runId);rows.push(summary);localStorage.setItem(resultsKey,JSON.stringify(rows.slice(-100)))}
  function sync(){
    const remaining=assertionIds.map((_,index)=>selected(index)).filter(value=>!value).length;
    finish.disabled=!reached||remaining>0;
    finish.textContent=!reached?'Return to the product first':(remaining?'Answer '+remaining+' check'+(remaining===1?'':'s')+' to finish':'Finish mission');
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{
    buttons.filter(peer=>peer.dataset.check===button.dataset.check).forEach(peer=>peer.setAttribute('aria-pressed',String(peer===button)));
    sync();
  }));
  async function send(row){
    try{
      const response=await fetch('/api/qa/evidence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(row)});
      if(!response.ok)return false;
      writePending(read(pendingKey,[]).filter(item=>item.run_id!==row.run_id));
      return true;
    }catch{return false}
  }
  finish.addEventListener('click',async()=>{
    if(finish.disabled)return;
    const now=new Date().toISOString();
    const answers=assertionIds.map((_,index)=>selected(index)?.dataset.value||'not_answered');
    const passed=answers.every(value=>value==='pass');
    const runId=id();
    const startedMs=Number(localStorage.getItem(startedKey)||Date.now());
    const row={schema_version:'1.0.0',lane:'jfl',run_id:runId,replay_of_run_id:null,level_id:'persona.'+mission,seed,build_sha:build,worker_version:build,started_at:new Date(startedMs).toISOString(),completed_at:now,duration_ms:Math.max(0,Date.now()-startedMs),tester_id:tester(),session_id:null,device:device(),fixture_facts:fixtureFacts,assertions:assertionIds.map((assertionId,index)=>({assertion_id:'persona.'+mission+'.'+assertionId,result:answers[index],answered_at:now})),outcome:passed?'pass':'fail',note:null,events:[{event_id:id(),type:'interaction',action:'finish_mission',component:'persona_checkpoint',occurred_at:now,sequence:0}]};
    const queue=read(pendingKey,[]).filter(item=>item.run_id!==runId);queue.push(row);writePending(queue);
    const summary={missionId:mission,seed,buildSha:build,outcome:row.outcome,runId,saveState:'pending',savedAt:now};saveSummary(summary);
    finish.disabled=true;finish.textContent='Saving feedback…';outcome.dataset.show='true';outcome.dataset.result=row.outcome;outcome.textContent=row.outcome==='pass'?'MISSION PASSED ✓ · saving feedback…':'MISSION FAILED · saving your feedback…';
    const saved=await send(row);
    summary.saveState=saved?'saved':'pending';saveSummary(summary);
    outcome.textContent=saved?(row.outcome==='pass'?'MISSION PASSED ✓ · feedback saved':'MISSION FAILED · feedback saved'):(row.outcome==='pass'?'MISSION PASSED ✓ · feedback queued':'MISSION FAILED · feedback queued');
    finish.textContent=saved?'Saved · returning to missions':'Queued · returning to missions';
    try{localStorage.removeItem(startedKey)}catch{}
    setTimeout(()=>location.assign('/qa/mission/end?completed=1'),500);
  });
  sync();
})();
</script>`;
}
