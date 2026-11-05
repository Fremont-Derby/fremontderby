import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { renderAdminGatewayPage } from '../src/adminGatewayPage.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function open(initial='A'){
  let current=initial;const nodes=new Map(),listeners=new Map(),pending=[];
  function node(key){if(!nodes.has(key))nodes.set(key,{hidden:true,dataset:{},textContent:'',querySelector:()=>null,addEventListener(type,fn){this[type]=fn;}});return nodes.get(key);}
  const window={addEventListener(type,fn){listeners.set(type,fn);},dispatchEvent(event){listeners.get(event.type)?.(event);}};
  const document={querySelector:node,addEventListener(type,fn){listeners.set(type,fn);},visibilityState:'visible'};
  vm.runInNewContext(renderAdminGatewayPage().match(/<script>([\s\S]*?)<\/script>/)[1],{document,window,Event,sessionStorage:{getItem:()=>current,removeItem:()=>{current='';}},fetch:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))});
  return {node,pending,get token(){return current;},change(value,event='fd:session-changed'){current=value;if(event)listeners.get(event)?.({key:'fd.accessToken'});},async reply(status,index=0){if(status==='error')pending[index].reject(new Error('old error'));else pending[index].resolve({ok:status===200,status});await tick();}};
}
for(const status of [200,401,403,'error'])test(`stale ${status} cannot affect replacement session`,async()=>{
  const f=open();f.change('B');await f.reply(status);assert.equal(f.token,'B');assert.equal(f.node('[data-admin-content]').hidden,true);assert.match(f.node('[data-status]').textContent,/sign-in changed/);
  f.node('[data-retry]').click();await f.reply(200,1);assert.equal(f.node('[data-admin-content]').hidden,false);
});
for(const kind of ['same-token','ABA','silent'])test(`invalidate ${kind}`,async()=>{const f=open();if(kind==='ABA'){f.change('B');f.change('A');}else f.change(kind==='silent'?'B':'A',kind==='silent'?null:'fd:session-changed');await f.reply(200);assert.equal(f.node('[data-admin-content]').hidden,true);});
for(const status of [200,401,403,500])test(`current ${status} recovery`,async()=>{const f=open();await f.reply(status);assert.equal(f.node(status===200?'[data-admin-content]':status===401?'[data-signed-out]':status===403?'[data-player-content]':'[data-access-error]').hidden,false);assert.equal(f.token,status===401?'':'A');});
test('signout clears rendered tools without fetching',async()=>{const f=open();await f.reply(200);f.change('');assert.equal(f.node('[data-admin-content]').hidden,true);assert.equal(f.node('[data-signed-out]').hidden,false);assert.equal(f.pending.length,1);});
test('initial signed out never fetches',()=>{const f=open('');assert.equal(f.pending.length,0);assert.equal(f.node('[data-signed-out]').hidden,false);});
test('newer retry supersedes earlier request',async()=>{const f=open();f.node('[data-retry]').click();await f.reply(403,1);await f.reply(200,0);assert.equal(f.node('[data-player-content]').hidden,false);assert.equal(f.node('[data-admin-content]').hidden,true);});

for(const event of ['focus','pageshow','visibilitychange','storage'])test(`lifecycle ${event} clears rendered tools`,async()=>{const f=open();await f.reply(200);f.change('B',event);assert.equal(f.node('[data-admin-content]').hidden,true);assert.equal(f.pending.length,1);f.node('[data-retry]').click();await f.reply(403,1);assert.equal(f.node('[data-player-content]').hidden,false);});
