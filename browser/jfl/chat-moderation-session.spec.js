import {readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import {renderChatModerationPage} from '../../src/chatModerationPage.js';
async function html(){
 if(process.env.PLAYWRIGHT_MODERATION_HTML_FILE)return readFileSync(process.env.PLAYWRIGHT_MODERATION_HTML_FILE,'utf8');
 if(process.env.PLAYWRIGHT_MODERATION_SOURCE==='bundled'){
 const config=JSON.parse(readFileSync('wrangler.jsonc','utf8'));
 const {default:worker}=await import(new URL('../../dist/'+(config.env?.jfl?.main||config.main).split('/').pop(),import.meta.url).href);
 return (await worker.fetch(new Request('https://moderation.test/messages/moderation'),{ENVIRONMENT:'jfl',SUPABASE_URL:'https://synthetic.test',SUPABASE_PUBLISHABLE_KEY:'synthetic'},{})).text();
 }
 return renderChatModerationPage({SUPABASE_URL:'https://synthetic.test',SUPABASE_PUBLISHABLE_KEY:'synthetic'});
}
for(const width of [320,1280])for(const change of ['B','','A'])test(`moderation ${width} stale refresh ${change||'signout'}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900}});
 try{
 await context.addInitScript(()=>{sessionStorage.setItem('fd.accessToken','A');sessionStorage.setItem('fd.refreshToken','refreshA');window.pending=[];window.fetch=(input)=>{const url=String(input);if(url.includes('/api/admin/chat-reports')||url.includes('/auth/v1/token'))return new Promise(resolve=>window.pending.push({resolve,url}));return Promise.resolve(new Response('{}',{status:200}));};});
 const page=await context.newPage();await page.route('https://moderation.test/**',async route=>route.fulfill({contentType:'text/html',body:await html()}));await page.goto('https://moderation.test/messages/moderation');
 await page.evaluate(()=>window.pending[0].resolve(new Response('{}',{status:401})));
 await expect.poll(()=>page.evaluate(()=>window.pending.length)).toBe(2);
 await page.evaluate(change=>{sessionStorage.setItem('fd.accessToken',change);sessionStorage.setItem('fd.refreshToken','replacementRefresh');window.dispatchEvent(new Event('fd:session-changed'));window.pending[1].resolve(new Response(JSON.stringify({access_token:'old',refresh_token:'oldRefresh'}),{status:200}));},change);
 await expect(page.locator('[data-status]')).toContainText(change?'sign-in changed':'Sign in');
 expect(await page.evaluate(()=>sessionStorage.getItem('fd.accessToken'))).toBe(change);expect(await page.evaluate(()=>sessionStorage.getItem('fd.refreshToken'))).toBe('replacementRefresh');expect(await page.evaluate(()=>window.pending.length)).toBe(2);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }finally{await context.close();}
});
for(const width of [320,1280])for(const outcome of ['replacement','current401','success'])test(`moderation ${width} decision ${outcome}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900}});
 try{
 await context.addInitScript(()=>{sessionStorage.setItem('fd.accessToken','A');sessionStorage.setItem('fd.refreshToken','refreshA');window.pending=[];window.fetch=(input,options={})=>{const url=String(input);if(url.includes('/api/admin/chat-reports')||url.includes('/auth/v1/token'))return new Promise(resolve=>window.pending.push({resolve,url,options}));return Promise.resolve(new Response('{}',{status:200}));};});
 const page=await context.newPage();await page.route('https://moderation.test/**',async route=>route.fulfill({contentType:'text/html',body:await html()}));await page.goto('https://moderation.test/messages/moderation');
 await page.evaluate(()=>window.pending[0].resolve(new Response(JSON.stringify({reports:[{report_id:'synthetic-report',status:'open',target_type:'direct',author_display_name:'Synthetic author',reporter_display_name:'Synthetic reporter',message_body:'Private synthetic report',reason:'Synthetic reason',created_at:'2026-11-01T00:00:00Z'}]}),{status:200})));
 await page.getByRole('button',{name:'Resolve · keep',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.pending.length)).toBe(2);
 expect(await page.evaluate(()=>window.pending[1].options.method)).toBe('POST');
 if(outcome==='replacement')await page.evaluate(()=>{sessionStorage.setItem('fd.accessToken','B');window.dispatchEvent(new Event('fd:session-changed'));});
 await page.evaluate(status=>window.pending[1].resolve(new Response(JSON.stringify(status===401?{error:'Sign in again'}:{}),{status})),outcome==='current401'?401:200);
 if(outcome==='success'){await expect.poll(()=>page.evaluate(()=>window.pending.length)).toBe(3);await page.evaluate(()=>window.pending[2].resolve(new Response('{"reports":[]}',{status:200})));await expect(page.locator('[data-status]')).toHaveText('Report resolved');}
 else{await expect(page.locator('[data-status]')).toContainText(outcome==='replacement'?'sign-in changed':'Sign in again');expect(await page.evaluate(()=>window.pending.length)).toBe(2);}
 if(outcome==='replacement')await expect(page.locator('[data-report-list]')).toBeEmpty();
 expect(await page.evaluate(()=>window.pending.filter(p=>p.options.method==='POST').length)).toBe(1);
 }finally{await context.close();}
});
