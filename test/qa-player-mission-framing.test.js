import test from 'node:test';
import assert from 'node:assert/strict';

import { enhanceQaPlayerMissionFraming, routeQaPlayerMissionFrame } from '../src/qaPlayerMissionFramingEnhancer.js';

const env = { ENVIRONMENT: 'jfl' };

function missionRequest(mission, seed, src = '/') {
  return new Request(
    `https://jfl.example/qa/player-mission/play?src=${encodeURIComponent(src)}`,
    { headers: { cookie: `fd_qa_mission=${encodeURIComponent(`${mission}:${seed}`)}` } },
  );
}

test('find-next-match uses staged chrome with multi-context Home goal, finish state, survey promise, and controls', async () => {
  const response = routeQaPlayerMissionFrame(missionRequest('player.find-next-match', 'frame-next-42'), env);
  const html = await response.text();
  assert.match(html, /STAGED QA MISSION · PLAYER/);
  assert.match(html, /synthetic player, team, and match data/);
  assert.match(html, /not changing real league or team data/);
  assert.match(html, /You are [^.<]+\. This test gives you multiple teams and multiple active seasons\./);
  assert.match(html, /Your goal: Without leaving Home, identify your soonest match across multiple teams and seasons/);
  assert.match(html, /season, team, opponent, date, time, and location/);
  assert.match(html, /Finish when: all six details are obvious on the first Home screen without choosing a team or season first/);
  assert.match(html, /4 quick PASS\/FAIL questions/);
  assert.match(html, /href="\/qa\/mission\/finish">Check mission<\/a>/);
  assert.match(html, /data-qa-stuck/);
  assert.match(html, /href="\/qa\/mission\/end">Abort mission<\/a>/);
});

test('availability uses the same staged chrome and an exact saved-state criterion', async () => {
  const response = routeQaPlayerMissionFrame(missionRequest('player.mark-availability', 'frame-availability-42', '/schedule'), env);
  const html = await response.text();
  assert.match(html, /STAGED QA MISSION · PLAYER/);
  assert.match(html, /Player mission: Report your availability/);
  assert.match(html, /Finish when: your (Available|Unavailable) choice is visibly saved/);
  assert.match(html, /href="\/qa\/mission\/availability-finish">Check mission<\/a>/);
  assert.doesNotMatch(html, /data-qa-stuck/);
  assert.match(html, /href="\/qa\/mission\/end">Abort mission<\/a>/);
});

test('player mission controls are centered and mobile safe', async () => {
  const html = await (routeQaPlayerMissionFrame(missionRequest('player.mark-availability', 'frame-mobile-42'), env)).text();
  assert.match(html, /justify-content:center/);
  assert.match(html, /min-height:44px/);
  assert.match(html, /grid-template-columns:1fr/);
  assert.match(html, /safe-area-inset-bottom/);
});

test('product enhancer removes duplicate in-product chrome and redirects only the top frame', async () => {
  const request = new Request('https://jfl.example/schedule', {
    headers: { cookie: 'fd_qa_mission=player.find-next-match%3Aframe-strip-42' },
  });
  const source = '<!doctype html><html><head></head><body><aside class="fd-qa-mission"><a>Old controls</a></aside><main>Product stays intact</main></body></html>';
  const response = new Response(source, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const html = await (await enhanceQaPlayerMissionFraming(response, request, env)).text();
  assert.doesNotMatch(html, /Old controls/);
  assert.match(html, /Product stays intact/);
  assert.match(html, /window\.top===window\.self/);
  assert.match(html, /\/qa\/player-mission\/play\?src=/);
});

test('player framing stays JFL mission-only and sanitizes QA frame sources', async () => {
  const request = missionRequest('player.find-next-match', 'frame-boundary-42', '/qa/admin');
  const frame = await routeQaPlayerMissionFrame(request, env);
  assert.match(await frame.text(), /src="\/"/);

  const product = new Response('<html><body>Product</body></html>', { headers: { 'content-type': 'text/html' } });
  const prodRequest = new Request('https://prod.example/', {
    headers: { cookie: 'fd_qa_mission=player.find-next-match%3Aframe-boundary-42' },
  });
  assert.equal(await enhanceQaPlayerMissionFraming(product, prodRequest, { ENVIRONMENT: 'production' }), product);
});
