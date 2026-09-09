import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCaptainAddPlayersFixture, enhanceQaCaptainAddPlayersMission } from '../src/qaCaptainAddPlayersMission.js';
import { enhanceQaCaptainMissionFraming } from '../src/qaCaptainMissionFramingEnhancer.js';

const env = { ENVIRONMENT: 'jfl' };
const seed = 'captain-framing-42';
const cookie = `fd_qa_mission=captain.add-players%3A${seed}`;

async function framedProduct(path = '/') {
  const request = new Request(`https://jfl.example${path}`, { headers: { cookie } });
  const base = new Response('<!doctype html><html><head><style></style></head><body><main>Product</main></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const withMission = await enhanceQaCaptainAddPlayersMission(base, request, env);
  return enhanceQaCaptainMissionFraming(withMission, request, env);
}

test('captain mission is explicitly presented as staged synthetic data', async () => {
  const fixture = buildCaptainAddPlayersFixture(seed);
  const html = await (await framedProduct('/')).text();
  assert.match(html, /STAGED QA MISSION · CAPTAIN/);
  assert.match(html, /synthetic players and team data/);
  assert.match(html, /not changing a real league or team/);
  assert.match(html, new RegExp(fixture.captain.name));
  assert.match(html, new RegExp(fixture.targets[0].display_name));
  assert.match(html, new RegExp(fixture.targets[1].display_name));
});

test('captain mission exposes completion criteria and survey expectation before play', async () => {
  const html = await (await framedProduct('/teams')).text();
  assert.match(html, /Finish when:/);
  assert.match(html, /both named players appear as pending invitations/);
  assert.match(html, /Check mission/);
  assert.match(html, /4 quick PASS\/FAIL questions/);
});

test('captain mission has centered mobile-safe abort and completion controls', async () => {
  const html = await (await framedProduct('/teams')).text();
  assert.match(html, /href="\/qa\/captain-add-players\/end">Abort mission<\/a>/);
  assert.match(html, /data-captain-finish/);
  assert.match(html, /justify-content:center/);
  assert.match(html, /min-height:44px/);
  assert.match(html, /grid-template-columns:1fr/);
});

test('framing stays JFL mission-only', async () => {
  const request = new Request('https://prod.example/', { headers: { cookie } });
  const response = new Response('<!doctype html><html><head></head><body><main>Product</main></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  assert.equal(await enhanceQaCaptainMissionFraming(response, request, { ENVIRONMENT: 'production' }), response);
});
