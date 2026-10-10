import test from 'node:test';
import assert from 'node:assert/strict';

test('prizeRepository.js createPrizeRepository has a usable type', async () => {
  const mod = await import('../src/prizeRepository.js');
  const value = mod.createPrizeRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('prizesPage.js renderPrizesPage has a usable type', async () => {
  const mod = await import('../src/prizesPage.js');
  const value = mod.renderPrizesPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('profileContactEnhancer.js enhanceProfileContact has a usable type', async () => {
  const mod = await import('../src/profileContactEnhancer.js');
  const value = mod.enhanceProfileContact;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('profileDirectMessageConsentEnhancer.js enhanceProfileDirectMessageConsent has a usable type', async () => {
  const mod = await import('../src/profileDirectMessageConsentEnhancer.js');
  const value = mod.enhanceProfileDirectMessageConsent;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('profilePage.js renderProfilePage has a usable type', async () => {
  const mod = await import('../src/profilePage.js');
  const value = mod.renderProfilePage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('profilePlayerClaimEnhancer.js enhanceProfilePlayerClaim has a usable type', async () => {
  const mod = await import('../src/profilePlayerClaimEnhancer.js');
  const value = mod.enhanceProfilePlayerClaim;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('profileSeasonRegistrationEnhancer.js enhanceProfileSeasonRegistration has a usable type', async () => {
  const mod = await import('../src/profileSeasonRegistrationEnhancer.js');
  const value = mod.enhanceProfileSeasonRegistration;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('profileSocialChatConsentEnhancer.js enhanceProfileSocialChatConsent has a usable type', async () => {
  const mod = await import('../src/profileSocialChatConsentEnhancer.js');
  const value = mod.enhanceProfileSocialChatConsent;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
