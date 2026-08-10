import test from 'node:test';
import assert from 'node:assert/strict';
import { renderProfilePage } from '../src/profilePage.js';

test('profile page renders Google-only sign-in and profile controls with browser-safe config', () => {
  const html = renderProfilePage({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  });

  assert.match(html, /Fremont Derby Profile/);
  assert.match(html, /Continue with Google/);
  assert.match(html, /data-google-sign-in/);
  assert.match(html, /\/auth\/v1\/authorize/);
  assert.match(html, /provider', 'google'/);
  assert.match(html, /\/api\/me\/profile/);
  assert.match(html, /data-team-body/);
  assert.match(html, /data-season-body/);
  assert.match(html, /publishable-key/);
  assert.doesNotMatch(html, /\/auth\/v1\/signup/);
  assert.doesNotMatch(html, /grant_type=password/);
  assert.doesNotMatch(html, /type="password"/);
  assert.doesNotMatch(html, /Create account/);
  assert.doesNotMatch(html, /service-role-secret/);
});
