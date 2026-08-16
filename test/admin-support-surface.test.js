import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('admin support page and API are wired', () => {
  const page = readFileSync(new URL('../src/adminSupportPage.js', import.meta.url), 'utf8');
  const http = readFileSync(new URL('../src/adminSupportHttp.js', import.meta.url), 'utf8');
  const entry = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  const gateway = readFileSync(new URL('../src/adminGatewayPage.js', import.meta.url), 'utf8');
  assert.match(page, /Admin Support/);
  assert.match(page, /Handled|Replied|Open/);
  assert.match(http, /\/api\/admin\/support/);
  assert.match(entry, /\/admin\/support/);
  assert.match(entry, /routeAdminSupport/);
  assert.match(gateway, /Admin Support/);
});

test('Profile no longer presents full admin menu as canonical', () => {
  const profile = readFileSync(new URL('../src/profilePage.js', import.meta.url), 'utf8');
  assert.match(profile, /Admin home/);
  assert.match(profile, /\/admin"/);
});
