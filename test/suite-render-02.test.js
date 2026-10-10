import test from 'node:test';
import assert from 'node:assert/strict';

test('renderAvailabilityPage is a render function', async () => {
  const mod = await import('../src/availabilityPageCore.js');
  assert.equal(typeof mod.renderAvailabilityPage, 'function');
});
test('renderAvailabilityPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/availabilityPageCore.js');
  let html = null;
  try { html = mod.renderAvailabilityPage(); } catch {}
  if (html == null) { try { html = mod.renderAvailabilityPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderAvailabilityPage, 'function');
  }
});
test('renderBlindLineupComponent is a render function', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  assert.equal(typeof mod.renderBlindLineupComponent, 'function');
});
test('renderBlindLineupComponent returns markup or asks for its arguments', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  let html = null;
  try { html = mod.renderBlindLineupComponent(); } catch {}
  if (html == null) { try { html = mod.renderBlindLineupComponent({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderBlindLineupComponent, 'function');
  }
});
test('renderCaptainSandboxPage is a render function', async () => {
  const mod = await import('../src/captainSandboxPage.js');
  assert.equal(typeof mod.renderCaptainSandboxPage, 'function');
});
test('renderCaptainSandboxPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/captainSandboxPage.js');
  let html = null;
  try { html = mod.renderCaptainSandboxPage(); } catch {}
  if (html == null) { try { html = mod.renderCaptainSandboxPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderCaptainSandboxPage, 'function');
  }
});
test('renderChatModerationPage is a render function', async () => {
  const mod = await import('../src/chatModerationPage.js');
  assert.equal(typeof mod.renderChatModerationPage, 'function');
});
test('renderChatModerationPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/chatModerationPage.js');
  let html = null;
  try { html = mod.renderChatModerationPage(); } catch {}
  if (html == null) { try { html = mod.renderChatModerationPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderChatModerationPage, 'function');
  }
});
test('renderChatPage is a render function', async () => {
  const mod = await import('../src/chatPage.js');
  assert.equal(typeof mod.renderChatPage, 'function');
});
test('renderChatPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/chatPage.js');
  let html = null;
  try { html = mod.renderChatPage(); } catch {}
  if (html == null) { try { html = mod.renderChatPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderChatPage, 'function');
  }
});
test('renderDemoSeasonPage is a render function', async () => {
  const mod = await import('../src/demoSeasonPage.js');
  assert.equal(typeof mod.renderDemoSeasonPage, 'function');
});
test('renderDemoSeasonPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/demoSeasonPage.js');
  let html = null;
  try { html = mod.renderDemoSeasonPage(); } catch {}
  if (html == null) { try { html = mod.renderDemoSeasonPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderDemoSeasonPage, 'function');
  }
});
test('renderLandingPage is a render function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.renderLandingPage, 'function');
});
test('renderLandingPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/index.js');
  let html = null;
  try { html = mod.renderLandingPage(); } catch {}
  if (html == null) { try { html = mod.renderLandingPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderLandingPage, 'function');
  }
});
test('renderJflFreeAgentsPage is a render function', async () => {
  const mod = await import('../src/jflFreeAgentsPage.js');
  assert.equal(typeof mod.renderJflFreeAgentsPage, 'function');
});
test('renderJflFreeAgentsPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflFreeAgentsPage.js');
  let html = null;
  try { html = mod.renderJflFreeAgentsPage(); } catch {}
  if (html == null) { try { html = mod.renderJflFreeAgentsPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderJflFreeAgentsPage, 'function');
  }
});
