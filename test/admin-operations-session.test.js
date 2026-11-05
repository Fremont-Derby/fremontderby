import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { renderAdminOperationsPage } from '../src/adminOperationsPage.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function open(access='A'){
 const store=new Map([['fd.accessToken',access],['fd.refreshToken','refreshA']]),nodes=new Map(),listeners=new Map(),pending=[];
 function node(key){if(!nodes.has(key))nodes.set(key,{textContent:'',dataset:{},children:[],append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},addEventListener(type,fn){this[type]=fn;}});return nodes.get(key);}
 const document={querySelector:node,querySelectorAll:()=>[],createElement:()=>node(Symbol()),visibilityState:'visible',addEventListener:(type,fn)=>listeners.set(type,fn)};
 const window={addEventListener:(type,fn)=>listeners.set(type,fn)};
 vm.runInNewContext(renderAdminOperationsPage({SUPABASE_URL:'https://synthetic.test',SUPABASE_PUBLISHABLE_KEY:'synthetic'}).match(/<script>([\s\S]*?)<\/script>/)[1],{document,window,sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},fetch:(url,options)=>new Promise((resolve,reject)=>pending.push({url,options,resolve,reject})),Intl,Date});
 return {store,node,pending,change(access,event='fd:session-changed'){store.set('fd.accessToken',access);store.set('fd.refreshToken','refresh'+access);if(event)listeners.get(event)?.({key:'fd.accessToken'});},async reply(index,status,body={}){pending[index].resolve({ok:status===200,status,text:async()=>JSON.stringify(body)});await tick();}};
}
for(const change of ['replacement','signout','same-token','ABA'])test(`late refresh preserves ${change}`,async()=>{
 const f=open();await f.reply(0,401);assert.equal(f.pending.length,2);
 if(change==='ABA'){f.change('B');f.change('A');}else f.change(change==='signout'?'':change==='same-token'?'A':'B');
 const expected=[...f.store];await f.reply(1,200,{access_token:'old',refresh_token:'oldRefresh'});
 assert.deepEqual([...f.store],expected);assert.equal(f.pending.length,2);
});
for(const status of [200,401,403,500])test(`old ${status} is ignored after silent replacement`,async()=>{const f=open();f.change('B',null);await f.reply(0,status);assert.equal(f.pending.length,1);assert.match(f.node('[data-status]').textContent,/sign-in changed/);});
test('late refresh body cannot replace signout',async()=>{const f=open();await f.reply(0,401);let finish;f.pending[1].resolve({ok:true,status:200,text:()=>new Promise(r=>finish=r)});await tick();f.change('');finish(JSON.stringify({access_token:'old',refresh_token:'oldRefresh'}));await tick();assert.equal(f.store.get('fd.accessToken'),'');assert.equal(f.pending.length,2);});
test('current refresh retries exactly once with refreshed access',async()=>{const f=open();await f.reply(0,401);await f.reply(1,200,{access_token:'new',refresh_token:'newRefresh'});assert.equal(f.pending.length,3);assert.equal(f.pending[2].options.headers.authorization,'Bearer new');await f.reply(2,401);assert.equal(f.pending.length,3);assert.equal(f.store.get('fd.refreshToken'),'newRefresh');});
test('initial signout never fetches',()=>{const f=open('');assert.equal(f.pending.length,0);});
test('newer read supersedes pending refresh without changing credentials',async()=>{const f=open();await f.reply(0,401);f.node('[data-refresh]').click();await f.reply(1,200,{access_token:'old'});assert.equal(f.store.get('fd.accessToken'),'A');assert.equal(f.pending.length,3);});
test('stale transport error leaves replacement recovery intact',async()=>{const f=open();f.change('B');f.pending[0].reject(new Error('old network failure'));await tick();assert.match(f.node('[data-status]').textContent,/sign-in changed/);});
for(const event of ['focus','pageshow','storage','visibilitychange'])test(`${event} clears private rows without fetching`,async()=>{const f=open();f.node('[data-league]').children=['private'];f.node('[data-system]').children=['private'];f.change('B',event);assert.equal(f.node('[data-league]').children.length,0);assert.equal(f.node('[data-system]').children.length,0);assert.equal(f.pending.length,1);});
test('session change while parsing operations body discards old result',async()=>{const f=open();let finish;f.pending[0].resolve({ok:true,status:200,text:()=>new Promise(r=>finish=r)});await tick();f.change('B');finish(JSON.stringify({overview:{overall:'healthy'}}));await tick();assert.match(f.node('[data-status]').textContent,/sign-in changed/);});
