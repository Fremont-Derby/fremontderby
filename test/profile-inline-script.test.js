import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { renderProfilePage } from '../src/profilePage.js';

test('Profile inline scripts compile before initializing session controls', () => {
  const html = renderProfilePage({ SUPABASE_URL: 'https://synthetic.invalid///', SUPABASE_PUBLISHABLE_KEY: 'synthetic' });
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0);
  for (const [, script] of scripts) assert.doesNotThrow(() => new Script(script));
});
