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
  '/trades',
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

function canaryName(host, expectEnv) {
  if (host === 'www.fremontderby.com') return 'www';
  if (expectEnv === 'production') return 'production';
  return expectEnv;
}

/** Derived from HOST_ENVIRONMENT_EXPECTATIONS — do not hand-edit. */
export const CANARY_HOSTS = Object.freeze(
  Object.entries(HOST_ENVIRONMENT_EXPECTATIONS).map(([host, expectEnv]) =>
    Object.freeze({
      name: canaryName(host, expectEnv),
      base: `https://${host}`,
      expectEnv,
    }),
  ),
);
