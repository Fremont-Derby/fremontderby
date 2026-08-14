import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { friendlyErrorMessage } from '../src/friendlyErrorMessage.js';
import { tokenRemapStyles } from '../src/tokenRemap.js';
import { renderDesignSystemCatalogPage } from '../src/designSystemCatalogPage.js';
import { renderProfilePage } from '../src/profilePage.js';

test('friendlyErrorMessage is shared and maps infrastructure errors', () => {
  assert.match(friendlyErrorMessage('Supabase request failed with 500'), /could not complete/i);
  assert.match(friendlyErrorMessage('jwt expired'), /sign-in expired/i);
  const profile = renderProfilePage({});
  assert.match(profile, /could not complete that action/i);
  assert.doesNotMatch(profile, /We could not load your profile\. Nothing was changed/);
});

test('token remap is centralized and used by surfaces', () => {
  assert.match(tokenRemapStyles, /--line:\s*var\(--fd-border\)/);
  const player = readFileSync(new URL('../src/playerSurfaceTheme.js', import.meta.url), 'utf8');
  const admin = readFileSync(new URL('../src/adminSurfaceTheme.js', import.meta.url), 'utf8');
  assert.match(player, /tokenRemapStyles/);
  assert.match(admin, /tokenRemapStyles/);
});

test('design system catalog route module renders swatches', () => {
  const html = renderDesignSystemCatalogPage();
  assert.match(html, /Design system catalog/);
  assert.match(html, /Token remap/);
});

test('router serves design-system path', () => {
  const router = readFileSync(new URL('../src/router.js', import.meta.url), 'utf8');
  assert.match(router, /\/design-system/);
  assert.match(router, /renderDesignSystemCatalogPage/);
});
