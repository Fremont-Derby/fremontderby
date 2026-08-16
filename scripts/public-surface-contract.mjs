#!/usr/bin/env node
/**
 * Contract for public HTML/API surfaces that must survive UI moves and deploys.
 * Used by canary workflows + unit tests that the router still references these paths.
 */
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
]);

export const PUBLIC_JSON_PATHS = Object.freeze([
  '/health',
  '/health/environment',
]);

/** Substrings that should appear in healthy HTML shells (not a full a11y suite). */
export const HTML_SHELL_MARKERS = Object.freeze([
  '<!doctype html',
  'fremont',
]);

export const CANARY_HOSTS = Object.freeze([
  { name: 'production', base: 'https://fremontderby.com', expectEnv: 'production' },
  { name: 'www', base: 'https://www.fremontderby.com', expectEnv: 'production' },
  { name: 'gamma', base: 'https://gamma.fremontderby.com', expectEnv: 'gamma' },
  { name: 'dru', base: 'https://dru.fremontderby.com', expectEnv: 'dru' },
  { name: 'jfl', base: 'https://jfl.fremontderby.com', expectEnv: 'jfl' },
]);
