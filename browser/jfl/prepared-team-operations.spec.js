import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { renderAdminSeasonTeamsPage } from '../../src/adminSeasonTeamsPage.js';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.setTimeout(20_000);
const season='36490000-1000-4000-8000-000000000001', second='36490000-1000-4000-8000-000000000002';
let html;
test.beforeAll(async({request})=>{
  if(process.env.PLAYWRIGHT_PREPARED_OPERATIONS_BASELINE)html=await readFile(process.env.PLAYWRIGHT_PREPARED_OPERATIONS_BASELINE,'utf8');
  else if(process.env.PLAYWRIGHT_PREPARED_OPERATIONS_HTML==='built'){
    const {default:worker}=await import('../../dist/routerEntry.js');
    html=await(await worker.fetch(new Request('https://jfl.fremontderby.com/admin/season-teams'),{ENVIRONMENT:'jfl'},{waitUntil(){}})).text();
  }else if(process.env.PLAYWRIGHT_PREPARED_OPERATIONS_HTML==='deployed'){
    expect(await(await request.get('/health/environment')).json()).toMatchObject({ok:true,environment:'jfl',expectedSupabaseSchema:'jfl',versionTag:process.env.PLAYWRIGHT_EXPECTED_SHA});
    html=await(await request.get('/admin/season-teams')).text();
  }else html=renderAdminSeasonTeamsPage({creationOperations:true});
});
async function fixture(browser,mobile){
  const context=await browser.newContext({viewport:{width:mobile?320:1280,height:900}});
  await context.addInitScript(()=>{if(!sessionStorage.getItem('fixture.initialized')){sessionStorage.setItem('fd.accessToken','synthetic-A');sessionStorage.setItem('fixture.initialized','1');}const now=Date.now;window.__offset=0;Date.now=()=>now()+window.__offset;});
  const writes=[],reads=[],operations=new Map();let failure=null,lookupFailure=null,hold=null;
  await context.route('**/*',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(path==='/admin/season-teams')return route.fulfill({body:html,contentType:'text/html'});
    if(!path.startsWith('/api/admin/'))return route.fulfill({json:{}});
    if(req.method()==='POST'){
      const body=req.postDataJSON();writes.push({path,body,token:req.headers().authorization});
      if(hold){const save=hold;hold=null;await save(route,body);return;}
      const team={id:'team-'+writes.length,season_id:path.split('/')[4],name:body.teamName,requested_name:body.teamName};
      if(failure){const f=failure;failure=null;if(f.commit)operations.set(body.operationId,team);if(f.abort)return route.abort();return route.fulfill(f.response);}
      operations.set(body.operationId,team);return route.fulfill({status:201,json:{team}});
    }
    reads.push(path);
    if(path==='/api/admin/seasons')return route.fulfill({json:{seasons:[{id:season,name:'First season',status:'registration'},{id:second,name:'Second season',status:'registration'}]}});
    if(path.includes('/prepared-team-operations/')){
      if(lookupFailure){const f=lookupFailure;lookupFailure=null;return route.fulfill(f);}
      return route.fulfill({json:{operation:operations.get(path.split('/').at(-1))??null}});
    }
    return route.fulfill({json:{registration:{teamCapacity:8,counts:{occupiedSlots:0}},teams:[]}});
  });
  const page=await context.newPage();page.setDefaultTimeout(4000);
  await page.goto('https://jfl.fremontderby.com/admin/season-teams?season='+season);
  await expect(page.locator('[data-create-button]')).toBeEnabled();
  return {page,context,writes,reads,operations,fail:f=>failure=f,lookupFail:f=>lookupFailure=f,hold:f=>hold=f};
}
async function create(f,name='Prepared team'){
  await dismiss(f);
  await f.page.locator('[data-create-name]').fill(name);await f.page.locator('[data-create-button]').click();
  await expect.poll(()=>f.writes.length).toBeGreaterThan(0);
}
async function dismiss(f){const close=f.page.getByRole('button',{name:'Dismiss error',exact:true});if(await close.isVisible())await close.click();}
async function reload(f){await dismiss(f);await f.page.locator('[data-reload-teams]').click();}
const state=f=>f.page.locator('[data-state]');
for(const mobile of [false,true]){
  test(`creation sends one UUID and clears confirmed intent (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      await create(f);await expect(state(f)).toContainText('created.');
      expect(f.writes[0].body.operationId).toMatch(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/);
      await create(f,'Another team');await expect(state(f)).toContainText('created.');expect(f.writes[1].body.operationId).not.toBe(f.writes[0].body.operationId);
    }finally{await f.context.close();}
  });
  test(`lost response confirms committed result through GET only (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      f.fail({commit:true,abort:true});await create(f);await expect(state(f)).toContainText('unconfirmed');
      await expect(f.page.locator('[data-create-button]')).toBeDisabled();await reload(f);await expect(state(f)).toContainText('creation confirmed');
      expect(f.writes).toHaveLength(1);expect(f.reads.filter(p=>p.includes('/prepared-team-operations/'))).toHaveLength(1);await expect(f.page.locator('[data-create-name]')).toHaveValue('');
    }finally{await f.context.close();}
  });
  test(`full page refresh recovers the persisted intent without a POST (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      f.fail({commit:true,abort:true});await create(f);await expect(state(f)).toContainText('unconfirmed');
      const saved=await f.page.evaluate(()=>JSON.parse(sessionStorage.getItem('fd.preparedTeamCreation')));expect(saved.id).toBe(f.writes[0].body.operationId);expect(JSON.stringify(saved)).not.toContain('synthetic-A');
      await f.page.reload();await expect(state(f)).toContainText('creation confirmed');expect(f.writes).toHaveLength(1);expect(await f.page.evaluate(()=>sessionStorage.getItem('fd.preparedTeamCreation'))).toBeNull();
    }finally{await f.context.close();}
  });
  test(`page refresh drops an intent belonging to the replaced session (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      f.fail({abort:true});await create(f);await expect(state(f)).toContainText('unconfirmed');
      await f.page.evaluate(()=>sessionStorage.setItem('fd.accessToken','synthetic-B'));await f.page.reload();await expect(f.page.locator('[data-create-button]')).toBeEnabled();
      expect(f.reads.filter(p=>p.includes('/prepared-team-operations/'))).toHaveLength(0);await create(f);await expect(state(f)).toContainText('created.');expect(f.writes[1].body.operationId).not.toBe(f.writes[0].body.operationId);
    }finally{await f.context.close();}
  });
  test(`absent result requires deliberate same-operation retry (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      f.fail({abort:true});await create(f);await expect(state(f)).toContainText('unconfirmed');await reload(f);
      await expect(state(f)).toContainText('No completed creation');expect(f.writes).toHaveLength(1);
      await dismiss(f);await f.page.getByRole('button',{name:'Try creation again'}).click();await expect(state(f)).toContainText('created.');
      expect(f.writes).toHaveLength(2);expect(f.writes[1].body.operationId).toBe(f.writes[0].body.operationId);
    }finally{await f.context.close();}
  });
  test(`HTTP429 honors delay and never automatically repeats POST (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      f.fail({response:{status:429,headers:{'Retry-After':'10'},contentType:'text/html',body:'<html>'+('provider diagnostic '.repeat(500))+'</html>'}});
      await create(f);await expect(state(f)).toContainText('Wait 10 seconds');const reads=f.reads.length;await reload(f);await expect(state(f)).toContainText('requested delay');expect(f.reads).toHaveLength(reads);
      expect(f.reads.filter(p=>p.includes('/prepared-team-operations/'))).toHaveLength(0);expect(f.writes).toHaveLength(1);
      await f.page.evaluate(()=>{window.__offset=11_000;});await reload(f);await expect(state(f)).toContainText('No completed creation');expect(f.writes).toHaveLength(1);
    }finally{await f.context.close();}
  });
  test(`invalid RetryAfter cannot enable another creation (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      f.fail({response:{status:429,json:{error:'Busy'}}});await create(f);await expect(state(f)).toContainText('valid Retry-After');await reload(f);await expect(state(f)).toContainText('valid Retry-After');
      await expect(f.page.locator('[data-create-button]')).toBeDisabled();expect(f.writes).toHaveLength(1);
    }finally{await f.context.close();}
  });
  test(`refresh preserves HTTP429 deadline before any application read (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      f.fail({commit:true,response:{status:429,headers:{'Retry-After':'10'},json:{error:'Busy'}}});await create(f);await expect(state(f)).toContainText('Wait 10 seconds');
      const reads=f.reads.length;await f.page.reload();await expect(state(f)).toContainText('requested delay');expect(f.reads).toHaveLength(reads);expect(f.writes).toHaveLength(1);
      await f.page.evaluate(()=>{window.__offset=11_000;});await reload(f);await expect(state(f)).toContainText('creation confirmed');expect(f.writes).toHaveLength(1);
    }finally{await f.context.close();}
  });
  test(`failed lookup preserves draft and prevents another POST (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      f.fail({commit:true,abort:true});await create(f);await expect(state(f)).toContainText('unconfirmed');f.lookupFail({status:503,json:{error:'Lookup unavailable'}});await reload(f);
      await expect(state(f)).toContainText('Lookup unavailable');await expect(f.page.locator('[data-create-name]')).toHaveValue('Prepared team');await expect(f.page.locator('[data-create-button]')).toBeDisabled();expect(f.writes).toHaveLength(1);
      await reload(f);await expect(state(f)).toContainText('creation confirmed');expect(f.writes).toHaveLength(1);
    }finally{await f.context.close();}
  });
  test(`name and season replacement allocate a different operation (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      f.fail({abort:true});await create(f);await expect(state(f)).toContainText('unconfirmed');await reload(f);await expect(state(f)).toContainText('No completed creation');
      await create(f,'Changed name');await expect(state(f)).toContainText('created.');expect(f.writes[1].body.operationId).not.toBe(f.writes[0].body.operationId);
      f.fail({abort:true});await create(f,'Third name');await expect(state(f)).toContainText('unconfirmed');await dismiss(f);await f.page.locator('[data-season]').selectOption(second);await expect(f.page.locator('[data-create-button]')).toBeEnabled();
      await create(f,'Third name');await expect(state(f)).toContainText('created.');expect(f.writes[3].body.operationId).not.toBe(f.writes[2].body.operationId);
    }finally{await f.context.close();}
  });
  test(`session replacement discards prior intent and stale completion (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      let release;f.hold(async route=>{await new Promise(resolve=>{release=resolve;});await route.fulfill({status:201,json:{team:{id:'old',season_id:season,name:'Prepared team'}}});});
      await create(f);await expect.poll(()=>Boolean(release)).toBe(true);
      await f.page.evaluate(()=>{sessionStorage.setItem('fd.accessToken','synthetic-B');window.dispatchEvent(new Event('fd:session-changed'));});release();await expect(state(f)).toContainText('sign-in changed');await reload(f);await expect(f.page.locator('[data-create-button]')).toBeEnabled();
      await create(f);await expect(state(f)).toContainText('created.');expect(f.writes[1].body.operationId).not.toBe(f.writes[0].body.operationId);expect(f.writes[1].token).toBe('Bearer synthetic-B');
    }finally{await f.context.close();}
  });
  test(`malformed success stays unconfirmed until authoritative lookup (${mobile})`,async({browser})=>{
    const f=await fixture(browser,mobile);try{
      f.fail({response:{status:201,json:{team:{id:'wrong',season_id:second,name:'Prepared team'}}}});await create(f);await expect(state(f)).toContainText('not confirmed');await expect(f.page.locator('[data-create-button]')).toBeDisabled();expect(f.writes).toHaveLength(1);
      f.lookupFail({json:{}});await reload(f);await expect(state(f)).toContainText('lookup was not confirmed');await expect(f.page.locator('[data-create-button]')).toBeDisabled();
    }finally{await f.context.close();}
  });
}
