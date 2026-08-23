import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

import { renderProfilePage } from '../src/profilePage.js';
import { enhanceProfileContact } from '../src/profileContactEnhancer.js';
import { enhanceProfilePlayerClaim } from '../src/profilePlayerClaimEnhancer.js';
import { enhanceProfileSeasonRegistration } from '../src/profileSeasonRegistrationEnhancer.js';
import { injectJflSimulatedGoogleAuth } from '../src/jflSimulatedGoogleAuth.js';
import { injectPersistentAuthSession } from '../src/persistentAuthSession.js';
import {
  enhanceJflModernProfile,
  jflModernProfileStyles,
  modernizeJflProfileHtml,
} from '../src/jflModernProfileEnhancer.js';

function htmlResponse(html) {
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

async function enhancedProfileHtml() {
  let response = htmlResponse(renderProfilePage({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'public-key',
  }));
  response = await enhanceProfileSeasonRegistration(response);
  response = await enhanceProfileContact(response);
  response = await enhanceProfilePlayerClaim(response);
  response = await enhanceJflModernProfile(response, { ENVIRONMENT: 'jfl' });
  return response.text();
}

async function fullJflProfileHtml() {
  let response = htmlResponse(renderProfilePage({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'public-key',
  }));
  response = await enhanceProfileSeasonRegistration(response);
  response = await enhanceProfileContact(response);
  response = await enhanceProfilePlayerClaim(response);
  response = await injectJflSimulatedGoogleAuth(response, {
    ENVIRONMENT: 'jfl',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: 'test-user@example.com',
  });
  response = await injectPersistentAuthSession(response);
  return response.text();
}

test('modern Profile is JFL-only and preserves non-JFL markup', async () => {
  const source = '<html><head></head><body><main class="app">Profile</main></body></html>';
  const production = await enhanceJflModernProfile(htmlResponse(source), { ENVIRONMENT: 'production' });
  assert.equal(await production.text(), source);
  const jfl = await enhanceJflModernProfile(htmlResponse(source), { ENVIRONMENT: 'jfl' });
  assert.match(await jfl.text(), /data-fd-modern-profile="true"/);
});

test('modern Profile promotes identity and keeps canonical settings surfaces', async () => {
  const html = await enhancedProfileHtml();
  assert.match(html, /data-fd-modern-profile="true"/);
  assert.match(html, /data-profile-identity/);
  assert.match(html, />Your profile</);
  assert.match(html, /data-season-now/);
  assert.match(html, /data-profile-contact/);
  assert.match(html, /data-player-claim/);
  assert.match(html, /data-profile-teams/);
  assert.match(html, /data-profile-seasons/);
  assert.match(html, /data-admin-tools/);
});

test('modern Profile preserves canonical save, registration, contact, claim, and auth contracts', async () => {
  const html = await enhancedProfileHtml();
  assert.match(html, /\/api\/me\/profile/);
  assert.match(html, /method: 'PUT'/);
  assert.match(html, /\/api\/me\/contact/);
  assert.match(html, /\/registration\/me/);
  assert.match(html, /\/api\/me\/player-claim/);
  assert.match(html, /Continue with Google/);
  assert.match(html, /fd\.accessToken/);
  assert.doesNotMatch(html, /SUPABASE_SERVICE_ROLE_KEY/);
});

test('modern Profile keeps private captain-contact copy and hides technical identifiers from primary presentation', async () => {
  const html = await enhancedProfileHtml();
  assert.match(html, /private league-administration contact information/i);
  assert.match(html, /Other players do not get access to it/i);
  assert.doesNotMatch(html, />Player ID</i);
  assert.doesNotMatch(html, />Team ID</i);
  assert.doesNotMatch(html, />Season ID</i);
  assert.doesNotMatch(html, />Database ID</i);
});

test('modern Profile has explicit mobile, focus, contrast-state, and forced-colors contracts', () => {
  assert.match(jflModernProfileStyles, /@media\(max-width:640px\)/);
  assert.match(jflModernProfileStyles, /focus-visible/);
  assert.match(jflModernProfileStyles, /@media\(forced-colors:active\)/);
  assert.match(jflModernProfileStyles, /min-height:44px/);
  assert.match(jflModernProfileStyles, /--fd-profile-green-dark:#033c25/);
});

test('modernizer is idempotent', () => {
  const source = '<html><head></head><body><main class="app">Profile</main></body></html>';
  const once = modernizeJflProfileHtml(source);
  const twice = modernizeJflProfileHtml(once);
  assert.equal(twice, once);
});

test('JFL simulated Profile login uses the canonical in-page session flow without forced reload interception', async () => {
  const html = await fullJflProfileHtml();
  assert.match(html, /data-fd-jfl-simulated-auth/);
  assert.match(html, /fd-jfl-simulated-google-oidc-v1/);
  assert.match(html, /setSession\s*\(/);
  assert.match(html, /return\s+loadProfile\(\)/);
  assert.doesNotMatch(html, /beginSimulatedSession/);
  assert.doesNotMatch(html, /window\.location\.assign\(\s*['"]\/profile['"]\s*\)/);
  assert.match(html, /document\.readyState === 'loading'/);
});

test('full JFL Profile response emits syntactically valid inline browser scripts', async () => {
  const html = await fullJflProfileHtml();
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => ({ source: match[1], tag: match[0].slice(0, match[0].indexOf('>') + 1) }));
  assert.ok(scripts.length > 0);
  scripts.forEach(({ source, tag }, index) => {
    assert.doesNotThrow(
      () => new vm.Script(source, { filename: `profile-inline-${index + 1}.js` }),
      `inline script ${index + 1} ${tag} must parse`,
    );
  });
});
