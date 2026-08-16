import test from 'node:test';
import assert from 'node:assert/strict';

import { renderProfilePage } from '../src/profilePage.js';

test('Profile presents signed-out identity state before private data surfaces', () => {
  const html = renderProfilePage({});

  assert.match(html, /data-status><\/div>/);
  assert.match(html, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html, /Sign in with Google to manage your profile, teams, availability, messages, and league-night scoring/);
  assert.match(html, /data-authenticated-content hidden/);
  assert.match(html, /setStatus\('Sign in to view your profile'\)/);
  assert.doesNotMatch(html, /data-player-id/);
  assert.doesNotMatch(html, /profile\.id/);
});

test('Profile distinguishes loading and true empty participation with useful next actions', () => {
  const html = renderProfilePage({});

  assert.match(html, /Loading team memberships…/);
  assert.match(html, /Loading season participation…/);
  assert.match(html, /No team memberships yet\./);
  assert.match(html, /'\/teams', 'Browse teams'/);
  assert.match(html, /No season participation yet\./);
  assert.match(html, /'\/schedule', 'View the league schedule'/);
  assert.match(html, /friendlyErrorMessage/);
  assert.match(html, /Your sign-in expired\. Continue with Google to sign in again\./);
  assert.match(html, /We could not load your profile\. Nothing was changed\. Please try again\./);
});

test('Profile history reflows on narrow phones without horizontal scrolling', () => {
  const html = renderProfilePage({});

  assert.match(html, /@media \(max-width: 820px\)/);
  assert.match(html, /\.panel \{ overflow: hidden; \}/);
  assert.match(html, /table \{ width: 100%; min-width: 0; table-layout: fixed; \}/);
  assert.match(html, /td::before \{ content: attr\(data-label\)/);
  assert.match(html, /td\.dataset\.label = label/);
  assert.match(html, /\['Season', row\.seasonName\], \['Team', row\.teamName\], \['Role', row\.role\]/);
  assert.match(html, /\['Season', row\.seasonName\], \['Type', row\.participationType\], \['Status', row\.status\]/);
  assert.doesNotMatch(html, /overflow-x: auto/);
  assert.doesNotMatch(html, /min-width: 620px/);
});
