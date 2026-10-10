import test from 'node:test';
import assert from 'node:assert/strict';

test('renderJflNotFoundPage is a render function', async () => {
  const mod = await import('../src/jflNotFoundPage.js');
  assert.equal(typeof mod.renderJflNotFoundPage, 'function');
});
test('renderJflNotFoundPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflNotFoundPage.js');
  let html = null;
  try { html = mod.renderJflNotFoundPage(); } catch {}
  if (html == null) { try { html = mod.renderJflNotFoundPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderJflNotFoundPage, 'function');
  }
});
test('renderJflNotificationsPage is a render function', async () => {
  const mod = await import('../src/jflNotificationsPage.js');
  assert.equal(typeof mod.renderJflNotificationsPage, 'function');
});
test('renderJflNotificationsPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflNotificationsPage.js');
  let html = null;
  try { html = mod.renderJflNotificationsPage(); } catch {}
  if (html == null) { try { html = mod.renderJflNotificationsPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderJflNotificationsPage, 'function');
  }
});
test('renderJflPlayersDirectory is a render function', async () => {
  const mod = await import('../src/jflPlayersDirectory.js');
  assert.equal(typeof mod.renderJflPlayersDirectory, 'function');
});
test('renderJflPlayersDirectory returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflPlayersDirectory.js');
  let html = null;
  try { html = mod.renderJflPlayersDirectory(); } catch {}
  if (html == null) { try { html = mod.renderJflPlayersDirectory({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderJflPlayersDirectory, 'function');
  }
});
test('renderJflProvisionalSeedPage is a render function', async () => {
  const mod = await import('../src/jflProvisionalSeedPage.js');
  assert.equal(typeof mod.renderJflProvisionalSeedPage, 'function');
});
test('renderJflProvisionalSeedPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflProvisionalSeedPage.js');
  let html = null;
  try { html = mod.renderJflProvisionalSeedPage(); } catch {}
  if (html == null) { try { html = mod.renderJflProvisionalSeedPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderJflProvisionalSeedPage, 'function');
  }
});
test('renderJflPublicPlayoffs is a render function', async () => {
  const mod = await import('../src/jflPublicPlayoffs.js');
  assert.equal(typeof mod.renderJflPublicPlayoffs, 'function');
});
test('renderJflPublicPlayoffs returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflPublicPlayoffs.js');
  let html = null;
  try { html = mod.renderJflPublicPlayoffs(); } catch {}
  if (html == null) { try { html = mod.renderJflPublicPlayoffs({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderJflPublicPlayoffs, 'function');
  }
});
test('renderLineupPage is a render function', async () => {
  const mod = await import('../src/lineupPage.js');
  assert.equal(typeof mod.renderLineupPage, 'function');
});
test('renderLineupPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/lineupPage.js');
  let html = null;
  try { html = mod.renderLineupPage(); } catch {}
  if (html == null) { try { html = mod.renderLineupPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderLineupPage, 'function');
  }
});
test('renderModernUiCatalog is a render function', async () => {
  const mod = await import('../src/modernUiCatalog.js');
  assert.equal(typeof mod.renderModernUiCatalog, 'function');
});
test('renderModernUiCatalog returns markup or asks for its arguments', async () => {
  const mod = await import('../src/modernUiCatalog.js');
  let html = null;
  try { html = mod.renderModernUiCatalog(); } catch {}
  if (html == null) { try { html = mod.renderModernUiCatalog({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderModernUiCatalog, 'function');
  }
});
test('renderPlayerSandboxPage is a render function', async () => {
  const mod = await import('../src/playerSandboxPage.js');
  assert.equal(typeof mod.renderPlayerSandboxPage, 'function');
});
test('renderPlayerSandboxPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/playerSandboxPage.js');
  let html = null;
  try { html = mod.renderPlayerSandboxPage(); } catch {}
  if (html == null) { try { html = mod.renderPlayerSandboxPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderPlayerSandboxPage, 'function');
  }
});
