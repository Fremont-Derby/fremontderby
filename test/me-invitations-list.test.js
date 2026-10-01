import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('exposes GET /api/me/invitations', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(src, /handleListOwnInvitationsRequest/);
  assert.match(src, /\/api\/me\/invitations/);
});
