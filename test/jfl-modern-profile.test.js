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
  assert.match(html, /data-fd-profile-status/);
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

test('modern Profile has explicit mobile, focus, readable disabled, and forced-colors contracts', () => {
  assert.match(jflModernProfileStyles, /@media\(max-width:640px\)/);
  assert.match(jflModernProfileStyles, /focus-visible/);
  assert.match(jflModernProfileStyles, /@media\(forced-colors:active\)/);
  assert.match(jflModernProfileStyles, /min-height:44px/);
  assert.match(jflModernProfileStyles, /--fd-profile-green-dark:#033c25/);
  assert.match(jflModernProfileStyles, /--fd-profile-disabled-bg:#c7d0ca/);
  assert.match(jflModernProfileStyles, /--fd-profile-disabled-ink:#1f2b24/);
  assert.match(jflModernProfileStyles, /button:disabled\{opacity:1/);
  assert.match(jflModernProfileStyles, /body\[data-fd-player-surface="profile"\].*button:disabled/);
  assert.match(jflModernProfileStyles, /button:disabled \*\{color:inherit/);
  assert.match(jflModernProfileStyles, /\.status\[data-tone="error"\]/);
  assert.match(jflModernProfileStyles, /\.badge\[data-tone="loading"\]/);
  assert.match(jflModernProfileStyles, /data-fd-modern-profile=.*\.primary:active/);
  assert.match(jflModernProfileStyles, /data-fd-modern-profile=.*\.primary:focus-visible/);
  assert.match(jflModernProfileStyles, /data-fd-modern-profile=.*\.status\[data-tone="ok"\]/);
  assert.match(jflModernProfileStyles, /--fd-profile-success-ink:#fff/);
  assert.match(jflModernProfileStyles, /data-fd-profile-status.*data-tone="ok"/);
  assert.match(jflModernProfileStyles, /-webkit-text-fill-color:#fff/);
});

test('Profile phone UI formats readable numbers and clears contradictory save states', async () => {
  const html = await enhancedProfileHtml();
  assert.match(html, /function formatPhone/);
  assert.match(html, /\\D\/g/);
  assert.match(html, /Contact on file/);
  assert.match(html, /Fix phone/);
  assert.match(html, /Saved phone was not changed/);
  assert.match(html, /badge\.dataset\.tone='error'/);
});

test('Profile async subpanels react to in-page sign-in and cannot stay loading forever', async () => {
  const html = await enhancedProfileHtml();
  const observers = html.match(/new MutationObserver\(syncSession\)/g) || [];
  assert.equal(observers.length, 2);
  const timeouts = html.match(/requestTimeoutMs=8000/g) || [];
  assert.equal(timeouts.length, 2);
  assert.match(html, /Season status took too long to load\. Please try again\./);
  assert.match(html, /Contact information took too long to load\. Please try again\./);
  assert.match(html, /data-contact-retry/);
  assert.match(html, /Retry loading contact/);
  assert.match(html, /action\.textContent='Try again'/);
  assert.match(html, /badge\.dataset\.tone='loading'/);
});

test('Profile name save preserves an existing rating while the partial save response renders', async () => {
  const html = await enhancedProfileHtml();
  assert.match(html, /data-fd-profile-ui-polish/);
  assert.match(html, /savedRating/);
  assert.match(html, /savedStatus/);
  assert.match(html, /rating\.textContent==='—'/);
  assert.match(html, /ratingStatus\.textContent==='Not rated'/);
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
    try {
      new vm.Script(source, { filename: `profile-inline-${index + 1}.js` });
    } catch (error) {
      assert.fail(`inline script ${index + 1} ${tag} failed to parse:\n${error.stack}`);
    }
  });
});
