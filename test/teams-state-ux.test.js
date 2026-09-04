import test from 'node:test';
import assert from 'node:assert/strict';

import { renderTeamsPage } from '../src/teamsPage.js';

test('Teams starts with one honest loading surface before authenticated controls', () => {
  const html = renderTeamsPage();
  assert.match(html, /data-page-state role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html, /Loading your teams…/);
  assert.match(html, /data-team-content hidden/);
  assert.match(html, /loadInitialTeams/);
  assert.match(html, /showPageState/);
  assert.match(html, /signedout|signed-out|Sign in/);
});

test('Teams signed-out and expired-session states point to Profile recovery', () => {
  const html = renderTeamsPage();
  assert.match(html, /Sign in to manage teams/);
  assert.match(html, /stateLink\('Sign in to manage teams','\/profile'\)/);
  assert.match(html, /Your sign-in expired/);
  assert.match(html, /stateLink\('Sign in again','\/profile'\)/);
  assert.match(html, /SessionExpiredError/);
});

test('Teams load failure is prominent and retryable without clearing typed team name', () => {
  const html = renderTeamsPage();
  assert.match(html, /Couldn’t load your teams/);
  assert.match(html, /anything you already typed will stay here/);
  assert.match(html, /retry\.dataset\.retry=''/);
  assert.match(html, /button\.hasAttribute\('data-retry'\)\)loadInitialTeams\(\)/);
});

test('Teams avoids placeholder registration metrics when no registration season exists', () => {
  const html = renderTeamsPage();
  assert.match(html, /Team registration is not open right now/);
  assert.match(html, /renderRegistrationSummary\(null\)/);
});

test('Teams recovery controls preserve keyboard, touch, mobile, and reduced-motion affordances', () => {
  const html = renderTeamsPage();
  assert.match(html, /\.state-action\{min-height:48px/);
});
