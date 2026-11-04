import test from 'node:test';
import assert from 'node:assert/strict';

import { routeQaPlayerNextMatchMission, enhanceQaPlayerNextMatchMission } from '../src/qaPlayerNextMatchMission2.js';
import { routeQaNextMatchRecovery, enhanceQaNextMatchRecovery } from '../src/qaNextMatchRecoveryEnhancer.js';

const env = { ENVIRONMENT: 'jfl' };
const missionCookie = 'fd_qa_mission=player.find-next-match%3Arecovery-seed';

async function productResponse(pathname = '/') {
  const base = new Response('<!doctype html><html><head><style></style></head><body><main>Product</main></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const request = new Request(`https://jfl.example${pathname}`, { headers: { cookie: missionCookie } });
  return enhanceQaPlayerNextMatchMission(base, request, env);
}

test('mission HUD makes player team and concrete objective explicit without route coaching', async () => {
  const request = new Request('https://jfl.example/', { headers: { cookie: missionCookie } });
  const original = await productResponse('/');
  const enhanced = await enhanceQaNextMatchRecovery(original, request, env);
  const html = await enhanced.text();

  assert.match(html, /You are <strong>.*<\/strong> on <strong>.*<\/strong>/);
  assert.match(html, /Find the next scheduled league match for <strong>.*<\/strong>/);
  assert.match(html, /Identify the opponent, date, time, and location/);
  assert.match(html, /I’m stuck/);
  assert.doesNotMatch(html, /Open Schedule|Tap Schedule|click Schedule/i);
});

test('stuck route records recoverable state and returns tester to current product surface', () => {
  const response = routeQaNextMatchRecovery(new Request(
    'https://jfl.example/qa/mission/stuck?mission=player.find-next-match&returnTo=%2Fschedule',
    { headers: { cookie: missionCookie } },
  ), env);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/schedule');
  assert.match(response.headers.get('set-cookie') || '', /fd_qa_next_match_stuck=1/);
});

test('stuck state reveals only a minimal hint and keeps mission controls available', async () => {
  const request = new Request('https://jfl.example/', { headers: { cookie: `${missionCookie}; fd_qa_next_match_stuck=1` } });
  const original = await productResponse('/');
  const enhanced = await enhanceQaNextMatchRecovery(original, request, env);
  const html = await enhanced.text();
  assert.match(html, /Hint:/);
  assert.match(html, /Look for where league nights and matchups are listed/);
  assert.match(html, /keep testing the rest of the mission/i);
  assert.match(html, /Quit/);
});

test('checkpoint pre-records discoverability fail after stuck recovery', async () => {
  const routeRequest = new Request('https://jfl.example/qa/mission/finish', { headers: { cookie: `${missionCookie}; fd_qa_next_match_stuck=1; fd_qa_mission_reached=recovery-seed` } });
  const original = routeQaPlayerNextMatchMission(routeRequest, env);
  assert.ok(original);
  const enhanced = await enhanceQaNextMatchRecovery(original, routeRequest, env);
  const html = await enhanced.text();
  assert.match(html, /Discoverability already recorded as FAIL/);
  assert.match(html, /data-check="0" data-value="fail" aria-pressed="true"/);
});

test('recovery route and enhancer fail closed outside JFL', async () => {
  const request = new Request('https://prod.example/qa/mission/stuck?mission=player.find-next-match', { headers: { cookie: missionCookie } });
  assert.equal(routeQaNextMatchRecovery(request, { ENVIRONMENT: 'production' }), null);
  const base = new Response('<html><body>unchanged</body></html>', { headers: { 'content-type': 'text/html' } });
  const response = await enhanceQaNextMatchRecovery(base, request, { ENVIRONMENT: 'production' });
  assert.equal(await response.text(), '<html><body>unchanged</body></html>');
});
