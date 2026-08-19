#!/usr/bin/env node
/**
 * Contract for public HTML/API surfaces that must survive UI moves and deploys.
 * Used by canary workflows + unit tests that the router still references these paths.
 */
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

export const PUBLIC_HTML_PATHS = Object.freeze([
  '/',
  '/standings',
  '/schedule',
  '/teams',
  '/scorecard',
  '/prizes',
  '/lineup',
  '/profile',
  '/availability',
  '/votes',
  '/admin',
  '/season-setup',
  '/playoffs',
  '/demo',
]);

export const PUBLIC_JSON_PATHS = Object.freeze([
  '/health',
  '/health/environment',
]);

/** Substrings that should appear in healthy HTML shells (not a full a11y suite). */
export const HTML_SHELL_MARKERS = Object.freeze([
  '<!doctype html',
  'fremont',
  'viewport',
]);

function canaryNameForHost(hostname, expectEnv) {
  if (hostname === 'fremontderby.com') return 'production';
  if (hostname === 'www.fremontderby.com') return 'www';
  return expectEnv;
}

/** Derived from HOST_ENVIRONMENT_EXPECTATIONS so host/env identity cannot drift. */
export const CANARY_HOSTS = Object.freeze(
  Object.entries(HOST_ENVIRONMENT_EXPECTATIONS).map(([hostname, expectEnv]) =>
    Object.freeze({
      name: canaryNameForHost(hostname, expectEnv),
      base: `https://${hostname}`,
      expectEnv,
    }),
  ),
);
