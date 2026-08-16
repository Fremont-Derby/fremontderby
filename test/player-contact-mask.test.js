import assert from 'node:assert/strict';
import test from 'node:test';
import { maskPhone, normalizeContact } from '../src/playerContactHttp.js';
import { enhanceProfileContact } from '../src/profileContactEnhancer.js';
import { livePageRefreshScript } from '../src/livePageRefresh.js';
import { decorateHtmlWithShell } from '../src/appShell.js';

test('maskPhone keeps only last four digits', () => {
  assert.equal(maskPhone('(206) 555-0199'), '••••0199');
  assert.equal(maskPhone('2065550199'), '••••0199');
  assert.equal(maskPhone(null), null);
});

test('normalizeContact hides full phone unless reveal is requested', () => {
  const contact = { phone: '2065550199', has_phone: true };
  const masked = normalizeContact(contact);
  assert.equal(masked.phone, null);
  assert.equal(masked.hasPhone, true);
  assert.equal(masked.phoneMasked, '••••0199');

  const revealed = normalizeContact(contact, { reveal: true });
  assert.equal(revealed.phone, '2065550199');
  assert.equal(revealed.phoneMasked, '••••0199');
});

test('profile contact UI defaults to reveal/hide controls and does not auto-fill phone', async () => {
  const response = await enhanceProfileContact(
    new Response('<!doctype html><html><head></head><body><section class="stack" data-authenticated-content hidden></section></body></html>', {
      headers: { 'content-type': 'text/html' },
    }),
  );
  const html = await response.text();
  assert.match(html, /data-contact-reveal/);
  assert.match(html, /Show phone number/);
  assert.match(html, /Hide phone number/);
  assert.match(html, /\/api\/me\/contact\?reveal=1/);
  assert.match(html, /autocomplete="off"/);
  assert.doesNotMatch(html, /phone\.value=contact\?\.phone/);
});

test('session cache never persists contact endpoints', () => {
  assert.match(livePageRefreshScript, /isSensitiveUrl/);
  assert.match(livePageRefreshScript, /api\/me\/contact/);
});

test('app shell injects no-referrer policy', () => {
  const html = decorateHtmlWithShell(
    '<!doctype html><html><head></head><body><main>x</main></body></html>',
    '/profile',
  );
  assert.match(html, /name="referrer"/);
  assert.match(html, /no-referrer/);
});
