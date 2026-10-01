import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('team invitations route allows GET list', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(src, /handleListTeamInvitationsRequest/);
  assert.match(src, /if \(request\.method === "GET"\) \{\s*return handleListTeamInvitationsRequest/s);
});
