import test from 'node:test';
import assert from 'node:assert/strict';
import { renderProfilePage } from '../src/profilePage.js';

test('profile page renders sign-in and profile controls with browser-safe config', () => {
  const html = renderProfilePage({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  });

  assert.match(html, /Fremont Derby Profile/);
  assert.match(html, /data-auth-form/);
  assert.match(html, /data-profile-form/);
  assert.match(html, /\/auth\/v1\/signup/);
  assert.match(html, /\/auth\/v1\/token\?grant_type=password/);
  assert.match(html, /\/api\/me\/profile/);
  assert.match(html, /data-team-body/);
  assert.match(html, /data-season-body/);
  assert.match(html, /publishable-key/);
  assert.doesNotMatch(html, /service-role-secret/);
});
