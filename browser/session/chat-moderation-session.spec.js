import {test,expect} from '@playwright/test';
import {renderChatModerationPage} from '../../src/chatModerationPage.js';
for(const width of [320,1280])for(const change of ['B','','A'])test(`moderation ${width} stale refresh ${change||'signout'}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900}});
 try{
 await context.addInitScript(()=>{sessionStorage.setItem('fd.accessToken','A');sessionStorage.setItem('fd.refreshToken','refreshA');window.pending=[];window.fetch=(url)=>new Promise(resolve=>window.pending.push({resolve,url}));});
 const page=await context.newPage();await page.route('https://moderation.test/**',route=>route.fulfill({contentType:'text/html',body:renderChatModerationPage({SUPABASE_URL:'https://synthetic.test',SUPABASE_PUBLISHABLE_KEY:'synthetic'})}));await page.goto('https://moderation.test/admin/chat-reports');
 await page.evaluate(()=>window.pending[0].resolve(new Response('{}',{status:401})));
 await expect.poll(()=>page.evaluate(()=>window.pending.length)).toBe(2);
 await page.evaluate(change=>{sessionStorage.setItem('fd.accessToken',change);sessionStorage.setItem('fd.refreshToken','replacementRefresh');window.dispatchEvent(new Event('fd:session-changed'));window.pending[1].resolve(new Response(JSON.stringify({access_token:'old',refresh_token:'oldRefresh'}),{status:200}));},change);
 await expect(page.locator('[data-status]')).toContainText(change?'sign-in changed':'Sign in');
 expect(await page.evaluate(()=>sessionStorage.getItem('fd.accessToken'))).toBe(change);expect(await page.evaluate(()=>sessionStorage.getItem('fd.refreshToken'))).toBe('replacementRefresh');expect(await page.evaluate(()=>window.pending.length)).toBe(2);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }finally{await context.close();}
});
