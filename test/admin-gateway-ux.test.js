import assert from 'node:assert/strict';
import test from 'node:test';

import { renderAdminGatewayPage } from '../src/adminGatewayPage.js';
import routerEntry from '../src/routerEntry.js';

test('Admin gateway starts with one truthful access-check state', () => {
  const html = renderAdminGatewayPage();
  assert.match(html, /Checking your access/);
  assert.match(html, /data-admin-content hidden/);
  assert.match(html, /data-player-content hidden/);
  assert.match(html, /data-signed-out hidden/);
  assert.match(html, /Only tools you can use will appear/);
});

test('Admin gateway keeps common league tools compact and touch friendly', () => {
  const html = renderAdminGatewayPage();
  assert.match(html, /href="\/admin\/operations"/);
  assert.match(html, /href="\/admin\/players"/);
  assert.match(html, /href="\/season-setup"/);
  assert.match(html, /href="\/messages\/moderation"/);
  assert.match(html, /min-height:48px/);
  assert.match(html, /@media\(max-width:620px\)/);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(html, /:focus-visible/);
});

test('Admin gateway distinguishes admin, non-admin, and signed-out outcomes', () => {
  const html = renderAdminGatewayPage();
  assert.match(html, /response\.status===401/);
  assert.match(html, /response\.status===403/);
  assert.match(html, /show\(adminContent\)/);
  assert.match(html, /show\(playerContent\)/);
  assert.match(html, /show\(signedOut\)/);
  assert.match(html, /role="status" aria-live="polite"/);
});

test('router serves the Admin gateway through the shared shell', async () => {
  const response = await routerEntry.fetch(new Request('https://fremontderby.com/admin'), {}, {});
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(html, /<h1 id="admin-title">Admin<\/h1>/);
  assert.match(html, /data-fd-shell/);
});

test('Profile keeps existing admin links while adding the gateway during migration', async () => {
  const response = await routerEntry.fetch(new Request('https://fremontderby.com/profile'), {}, {});
  const html = await response.text();
  assert.match(html, /href="\/admin">Admin home<\/a>/);
  assert.match(html, /href="\/admin\/players">Players<\/a>/);
  assert.match(html, /href="\/admin\/season-teams">Season teams<\/a>/);
});
