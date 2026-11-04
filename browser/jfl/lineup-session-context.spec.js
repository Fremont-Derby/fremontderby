import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { renderLineupPage } from '../../src/lineupPage.js';
const id = n => `36930000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const teams = [0,1,2].map(i => ({ teamId: id(i+1),teamName: ['Old private team','New private team','Other private team'][i],
  seasonId: id(10),seasonName: 'Synthetic season',lineupRounds: [1,2].map(n => ({ roundId: id(20+i*2+n),
    roundNumber: n,scheduledOn: '2026-11-11',opponentName: 'Synthetic opponent',tableNumber: 1,teamMatchStatus: 'scheduled' })) }));
async function html() {
  if (process.env.PLAYWRIGHT_LINEUP_HTML_FILE) return readFileSync(process.env.PLAYWRIGHT_LINEUP_HTML_FILE,'utf8');
  if (process.env.PLAYWRIGHT_LINEUP_SOURCE === 'bundled') {
    const config = JSON.parse(readFileSync(new URL('../../wrangler.jsonc',import.meta.url),'utf8'));
    const { default: worker } = await import(new URL('../../dist/'+(config.env?.jfl?.main||config.main).split('/').pop(),import.meta.url).href);
    return (await worker.fetch(new Request('https://session.test/lineup'),{ ENVIRONMENT: 'jfl' },{})).text();
  }
  return renderLineupPage();
}
async function open(browser,mobile,{ target = '/api/me/teams',phase = 'headers',status = 200,method = 'GET',hold = true,reject = false } = {}) {
  const context = await browser.newContext({ baseURL: 'https://session.test',viewport: { width: mobile?320:1280,height: 900 } });
  await context.addInitScript(({ target,phase,method,hold,reject }) => {
    if (location.origin !== 'https://session.test') return;
    sessionStorage.setItem('fd.accessToken','session-A');
    window.__wire = { held: null };
    const original = fetch;
    window.fetch = async (input,init={}) => {
      const path = new URL(typeof input === 'string'?input:input.url,location.href).pathname;
      const response = await original(input,init),text = await response.text();
      const next = new Response(text,{ status: response.status,headers: response.headers });
      const token = new Headers(init.headers).get('authorization');
      const chosen = hold && !window.__wire.held && path.endsWith(target) && (init.method||'GET')===method && token==='Bearer session-A';
      if (!chosen) return next;
      let release; const gate = new Promise(resolve => { release=resolve; });
      const state = { phase,path,drained:false,release:()=>release() }; window.__wire.held=state;
      if (phase==='headers') { await gate;setTimeout(()=>{state.drained=true},0);if(reject)throw new Error('Synthetic stale transport failure'); }
      const nativeText=next.text.bind(next);
      next.text=async()=>{if(phase==='body'){state.bodyEntered=true;await gate;if(reject){setTimeout(()=>{state.drained=true},0);throw new Error('Synthetic stale body failure')}}const value=await nativeText();setTimeout(()=>{state.drained=true},0);return value};
      return next;
    };
  },{ target,phase,method,hold,reject });
  const page = await context.newPage(),requests=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let altered=false;
  await context.route('https://session.test/**',async route => {
    const request=route.request(),path=new URL(request.url()).pathname,token=request.headers().authorization;
    if(path==='/lineup')return route.fulfill({contentType:'text/html',body:await html()});
    if(!path.startsWith('/api/'))return route.fulfill({status:404,body:''});
    requests.push({path,method:request.method(),token,body:request.postData()});
    let code=200,body={};
    if(hold&&!altered&&path.endsWith(target)&&request.method()===method&&token==='Bearer session-A'){code=status;altered=true}
    const owned=token==='Bearer session-B'?[teams[1]]:[teams[0],teams[2]];
    if(path==='/api/me/teams')body={teamManagement:{captain_teams:owned}};
    else if(path.startsWith('/api/teams/')){
      const team=teams.find(t=>path.includes('/'+t.teamId+'/'));
      if(!owned.includes(team)){code=403;body={error:'Synthetic wrong-team denial'}}
      else if(path.endsWith('/availability'))body={availability:[{player_id:id(50+teams.indexOf(team)),display_name:team.teamName+' player',participation_type:'roster',availability_status:'available',eligible:true}]};
      else body={lineups:[]};
    }
    return route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto('/lineup?season='+id(10));
  return {context,page,requests,errors};
}
async function held(f,phase){await expect.poll(()=>f.page.evaluate(()=>Boolean(window.__wire.held&&(window.__wire.held.phase!=='body'||window.__wire.held.bodyEntered)))).toBe(true)}
async function release(f){await f.page.evaluate(()=>window.__wire.held.release());await expect.poll(()=>f.page.evaluate(()=>window.__wire.held.drained)).toBe(true)}
async function switchSession(f,token='session-B',event='fd:session-changed'){
  await f.page.evaluate(({token,event})=>{sessionStorage.setItem('fd.accessToken',token);window.dispatchEvent(new Event(event))},{token,event});
  await expect(f.page.locator('[data-workspace]')).toBeHidden();
}
async function ready(f,team=teams[0]){await expect(f.page.locator('[data-status]')).toHaveAttribute('data-tone','ok');await expect(f.page.locator('[data-team-select]')).toHaveValue(team.teamId)}
async function reloadCurrent(f){await f.page.locator('[data-gate-retry]').click();await ready(f,teams[1])}

for(const mobile of [false,true])test.describe(mobile?'phone lineup session':'desktop lineup session',()=>{
  for(const target of ['/api/me/teams','/availability'])for(const phase of ['headers','body'])for(const status of [200,401]){
    test(`old ${status} ${target} ${phase} cannot affect a new session`,async({browser})=>{
      const f=await open(browser,mobile,{target,phase,status});
      try{
        await held(f,phase);await switchSession(f);await release(f);
        expect(await f.page.evaluate(()=>sessionStorage.getItem('fd.accessToken'))).toBe('session-B');
        await expect(f.page.locator('body')).not.toContainText('Old private team');
        expect(f.requests.filter(r=>r.method!=='GET')).toEqual([]);
        await reloadCurrent(f);expect(f.errors).toEqual([]);
      }finally{await f.context.close()}
    });
  }
  for(const target of ['/api/me/teams','/availability'])for(const phase of ['headers','body'])test(`stale rejected ${target} ${phase} cannot replace current recovery`,async({browser})=>{
    const f=await open(browser,mobile,{target,phase,reject:true});
    try{await held(f);await switchSession(f);await release(f);
      await expect(f.page.locator('[data-gate-title]')).toHaveText('Your sign-in changed');
      await expect(f.page.locator('body')).not.toContainText('Synthetic stale');await reloadCurrent(f);expect(f.errors).toEqual([]);
    }finally{await f.context.close()}
  });
  for(const event of ['fd:session-changed','storage','focus'])test(`loaded private state is cleared on ${event}`,async({browser})=>{
    const f=await open(browser,mobile,{hold:false});
    try{await ready(f);await expect(f.page.locator('body')).toContainText('Old private team player');await switchSession(f,'session-B',event);
      await expect(f.page.locator('body')).not.toContainText('Old private team');await reloadCurrent(f);expect(f.errors).toEqual([]);
    }finally{await f.context.close()}
  });
  test('observed same-token and ABA events invalidate pending bodies',async({browser})=>{
    const f=await open(browser,mobile,{phase:'body'});
    try{await held(f);await switchSession(f,'session-A');await switchSession(f,'session-B');await switchSession(f,'session-A');await release(f);
      await expect(f.page.locator('[data-workspace]')).toBeHidden();await expect(f.page.locator('body')).not.toContainText('Old private team');
      expect(await f.page.evaluate(()=>sessionStorage.getItem('fd.accessToken'))).toBe('session-A');expect(f.errors).toEqual([]);
    }finally{await f.context.close()}
  });
  test('current401 expires only the current token with Profile recovery',async({browser})=>{
    const f=await open(browser,mobile,{status:401});
    try{await held(f);await release(f);await expect(f.page.locator('[data-gate-title]')).toContainText('Sign in');
      expect(await f.page.evaluate(()=>sessionStorage.getItem('fd.accessToken'))).toBeNull();await expect(f.page.locator('[data-gate-action]')).toHaveAttribute('href','/profile');
      expect(f.requests.filter(r=>r.method!=='GET')).toEqual([]);expect(f.errors).toEqual([]);
    }finally{await f.context.close()}
  });
  test('a pending submission is never replayed into a new session',async({browser})=>{
    const f=await open(browser,mobile,{target:'/lineup',method:'POST',phase:'body'});
    try{await ready(f);
      for(let i=0;i<3;i++){
        const button=mobile?f.page.getByRole('button',{name:'Forfeit',exact:true}).first():f.page.getByRole('button',{name:'Forfeit slot',exact:true}).first();
        await button.click();
      }
      f.page.once('dialog',dialog=>dialog.accept());
      await (mobile?f.page.locator('[data-mobile-submit]'):f.page.locator('[data-submit]')).click();
      await held(f);await switchSession(f);await reloadCurrent(f);await release(f);
      await ready(f,teams[1]);await expect(f.page.locator('[data-slot-count]')).toHaveText('0 / 3');
      const writes=f.requests.filter(r=>r.method==='POST');expect(writes).toHaveLength(1);expect(writes[0].token).toBe('Bearer session-A');
      expect(await f.page.evaluate(()=>sessionStorage.getItem('fd.accessToken'))).toBe('session-B');expect(f.errors).toEqual([]);
    }finally{await f.context.close()}
  });
  test('an old body cannot repopulate a changed week',async({browser})=>{
    const f=await open(browser,mobile,{target:'/availability',phase:'body'});
    try{await held(f);await f.page.locator('[data-round-select]').selectOption(teams[0].lineupRounds[1].roundId);await ready(f);await release(f);
      await expect(f.page.locator('[data-round-select]')).toHaveValue(teams[0].lineupRounds[1].roundId);
      await expect(f.page.locator('[data-slot-count]')).toHaveText('0 / 3');expect(f.requests.filter(r=>r.method!=='GET')).toEqual([]);expect(f.errors).toEqual([]);
    }finally{await f.context.close()}
  });
  test('old foreground body cannot overwrite a manual team change',async({browser})=>{
    const f=await open(browser,mobile,{target:'/availability',phase:'body'});
    try{await held(f);await f.page.locator('[data-team-select]').selectOption(teams[2].teamId);await ready(f,teams[2]);await release(f);
      await expect(f.page.locator('body')).not.toContainText('Old private team player');await expect(f.page.locator('[data-team-select]')).toHaveValue(teams[2].teamId);expect(f.errors).toEqual([]);
    }finally{await f.context.close()}
  });
});
