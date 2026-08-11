import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pageUrl = new URL('../src/captainSandboxPage.js', import.meta.url);
const source = await readFile(pageUrl, 'utf8');

test('captain War Games begins with pending player requests and a three-player readiness threshold', () => {
  assert.match(source, /readinessMinimum:\s*3/);
  assert.match(source, /formationRequests:\s*\[/);
  assert.match(source, /Object\.fromEntries\(fixture\.formationRequests\.map\(p=>\[p\.id,'pending'\]\)\)/);
  assert.match(source, /committedCount\(\)>=fixture\.readinessMinimum/);
});

test('formation requires both captain approval and rejection paths before unlocking lineup work', () => {
  assert.match(source, /decisions\.filter\(v=>v==='approved'\)\.length>=2/);
  assert.match(source, /decisions\.includes\('declined'\)/);
  assert.match(source, /Finish formation to unlock weekly availability/);
  assert.match(source, /Approve at least two requests, reject at least one/);
});

test('midseason churn can remove non-captains and restore viability through accepted requests', () => {
  assert.match(source, /data-remove-member/);
  assert.match(source, /fixture\.churnRequests\.map\(churnRequestHtml\)/);
  assert.match(source, /state\.churn\[el\.dataset\.churn\]=el\.dataset\.decision/);
  assert.match(source, /Approve a replacement to restore viability/);
  assert.match(source, /Captain cannot be removed/);
});

test('captain sandbox remains deterministic session-only practice with no competitive write endpoint', () => {
  assert.match(source, /const storageKey='fd\.captainSandbox\.v1'/);
  assert.match(source, /sessionStorage\.getItem\(storageKey\)/);
  assert.match(source, /sessionStorage\.setItem\(storageKey/);
  assert.match(source, /parsed&&parsed\.formation&&parsed\.churn&&Array\.isArray\(parsed\.removed\)\?parsed:fresh\(\)/);
  assert.match(source, /Reset entire captain War Game/);
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /\/api\//);
  assert.doesNotMatch(source, /SUPABASE_/);
});
