import {readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import {renderAdminOperationsPage} from '../../src/adminOperationsPage.js';
async function html(){
 if(process.env.PLAYWRIGHT_OPERATIONS_HTML_FILE)return readFileSync(process.env.PLAYWRIGHT_OPERATIONS_HTML_FILE,'utf8');
 if(process.env.PLAYWRIGHT_OPERATIONS_SOURCE==='bundled'){
 const config=JSON.parse(readFileSync('wrangler.jsonc','utf8'));
 const {default:worker}=await import(new URL('../../dist/'+(config.env?.jfl?.main||config.main).split('/').pop(),import.meta.url).href);
 return (await worker.fetch(new Request('https://operations.test/admin/operations'),{ENVIRONMENT:'jfl',SUPABASE_URL:'https://synthetic.test',SUPABASE_PUBLISHABLE_KEY:'synthetic'},{})).text();
 }
 return renderAdminOperationsPage({SUPABASE_URL:'https://synthetic.test',SUPABASE_PUBLISHABLE_KEY:'synthetic'});
}
for(const width of [320,1280])for(const change of ['B','','A'])test(`operations ${width} stale refresh ${change||'signout'}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900}});
 try{
 await context.addInitScript(()=>{sessionStorage.setItem('fd.accessToken','A');sessionStorage.setItem('fd.refreshToken','refreshA');window.pending=[];window.fetch=(input)=>{const url=String(input);if(url.includes('/api/admin/operations')||url.includes('/auth/v1/token'))return new Promise(resolve=>window.pending.push({resolve,url}));return Promise.resolve(new Response('{}',{status:200}));};});
 const page=await context.newPage();await page.route('https://operations.test/**',async route=>route.fulfill({contentType:'text/html',body:await html()}));await page.goto('https://operations.test/admin/operations');
 await page.evaluate(()=>window.pending[0].resolve(new Response('{}',{status:401})));
 await expect.poll(()=>page.evaluate(()=>window.pending.length)).toBe(2);
 await page.evaluate(change=>{sessionStorage.setItem('fd.accessToken',change);sessionStorage.setItem('fd.refreshToken','replacementRefresh');window.dispatchEvent(new Event('fd:session-changed'));window.pending[1].resolve(new Response(JSON.stringify({access_token:'old',refresh_token:'oldRefresh'}),{status:200}));},change);
 await expect(page.locator('[data-status]')).toContainText(change?'sign-in changed':'Sign in');
 expect(await page.evaluate(()=>sessionStorage.getItem('fd.accessToken'))).toBe(change);expect(await page.evaluate(()=>sessionStorage.getItem('fd.refreshToken'))).toBe('replacementRefresh');expect(await page.evaluate(()=>window.pending.length)).toBe(2);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }finally{await context.close();}
});
