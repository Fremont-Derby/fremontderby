import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeApiPathname } from '../src/pathAliases.js';

test('admin gateway links audit and moderation', () => {
  const src = readFileSync(new URL('../src/adminGatewayPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/admin\/audit"/);
  assert.match(src, /href="\/messages\/moderation"/);
  assert.match(src, /Need help from a league admin/);
});

test('invitation and scoring path aliases', () => {
  assert.equal(normalizeApiPathname('/api/me/invites'), '/api/me/invitations');
  assert.equal(normalizeApiPathname('/api/me/team-invites'), '/api/me/invitations');
  assert.equal(normalizeApiPathname('/api/me/scorable'), '/api/me/scorable-matches');
  assert.equal(normalizeApiPathname('/api/me/pending-ready-checks'), '/api/me/ready-checks');
});
