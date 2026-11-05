import { test,expect } from '@playwright/test';
import { renderAdminGatewayPage } from '../../src/adminGatewayPage.js';
for(const width of [320,1280])for(const outcome of [200,401,403,500,'error'])test(`gateway ${width} stale ${outcome}`,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height:900}});
  try{
    await context.addInitScript(()=>{sessionStorage.setItem('fd.accessToken','A');window.pending=[];window.fetch=()=>new Promise((resolve,reject)=>window.pending.push({resolve,reject}));});
    const page=await context.newPage();
    await page.route('https://gateway.test/**',route=>route.fulfill({contentType:'text/html',body:renderAdminGatewayPage()}));
    await page.goto('https://gateway.test/admin');
    await page.evaluate(()=>{sessionStorage.setItem('fd.accessToken','B');window.dispatchEvent(new Event('fd:session-changed'));});
    await page.evaluate(outcome=>{if(outcome==='error')window.pending[0].reject(new Error('old'));else window.pending[0].resolve(new Response('',{status:outcome}));},outcome);
    await expect(page.locator('[data-status]')).toContainText('sign-in changed');
    await expect(page.locator('[data-admin-content]')).toBeHidden();
    expect(await page.evaluate(()=>sessionStorage.getItem('fd.accessToken'))).toBe('B');
    await page.locator('[data-retry]').click();
    await page.evaluate(()=>window.pending[1].resolve(new Response('',{status:200})));
    await expect(page.locator('[data-admin-content]')).toBeVisible();
    await page.evaluate(()=>{sessionStorage.removeItem('fd.accessToken');window.dispatchEvent(new Event('fd:session-changed'));});
    await expect(page.locator('[data-admin-content]')).toBeHidden();
    await expect(page.locator('[data-signed-out]')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }finally{await context.close();}
});
