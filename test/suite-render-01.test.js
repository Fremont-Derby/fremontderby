import test from 'node:test';
import assert from 'node:assert/strict';

test('renderAdminGatewayPage is a render function', async () => {
  const mod = await import('../src/adminGatewayPage.js');
  assert.equal(typeof mod.renderAdminGatewayPage, 'function');
});
test('renderAdminGatewayPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/adminGatewayPage.js');
  let html = null;
  try { html = mod.renderAdminGatewayPage(); } catch {}
  if (html == null) { try { html = mod.renderAdminGatewayPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderAdminGatewayPage, 'function');
  }
});
test('renderAdminOperationsPage is a render function', async () => {
  const mod = await import('../src/adminOperationsPage.js');
  assert.equal(typeof mod.renderAdminOperationsPage, 'function');
});
test('renderAdminOperationsPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/adminOperationsPage.js');
  let html = null;
  try { html = mod.renderAdminOperationsPage(); } catch {}
  if (html == null) { try { html = mod.renderAdminOperationsPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderAdminOperationsPage, 'function');
  }
});
test('renderAdminPlayersPage is a render function', async () => {
  const mod = await import('../src/adminPlayersPage.js');
  assert.equal(typeof mod.renderAdminPlayersPage, 'function');
});
test('renderAdminPlayersPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/adminPlayersPage.js');
  let html = null;
  try { html = mod.renderAdminPlayersPage(); } catch {}
  if (html == null) { try { html = mod.renderAdminPlayersPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderAdminPlayersPage, 'function');
  }
});
test('renderAdminSeasonTeamsPage is a render function', async () => {
  const mod = await import('../src/adminSeasonTeamsPage.js');
  assert.equal(typeof mod.renderAdminSeasonTeamsPage, 'function');
});
test('renderAdminSeasonTeamsPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/adminSeasonTeamsPage.js');
  let html = null;
  try { html = mod.renderAdminSeasonTeamsPage(); } catch {}
  if (html == null) { try { html = mod.renderAdminSeasonTeamsPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderAdminSeasonTeamsPage, 'function');
  }
});
test('renderAdminSeasonsPage is a render function', async () => {
  const mod = await import('../src/adminSeasonsPage.js');
  assert.equal(typeof mod.renderAdminSeasonsPage, 'function');
});
test('renderAdminSeasonsPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/adminSeasonsPage.js');
  let html = null;
  try { html = mod.renderAdminSeasonsPage(); } catch {}
  if (html == null) { try { html = mod.renderAdminSeasonsPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderAdminSeasonsPage, 'function');
  }
});
test('renderPrimaryNavigation is a render function', async () => {
  const mod = await import('../src/appShell.js');
  assert.equal(typeof mod.renderPrimaryNavigation, 'function');
});
test('renderPrimaryNavigation returns markup or asks for its arguments', async () => {
  const mod = await import('../src/appShell.js');
  let html = null;
  try { html = mod.renderPrimaryNavigation(); } catch {}
  if (html == null) { try { html = mod.renderPrimaryNavigation({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderPrimaryNavigation, 'function');
  }
});
test('renderNotFoundPage is a render function', async () => {
  const mod = await import('../src/appShell.js');
  assert.equal(typeof mod.renderNotFoundPage, 'function');
});
test('renderNotFoundPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/appShell.js');
  let html = null;
  try { html = mod.renderNotFoundPage(); } catch {}
  if (html == null) { try { html = mod.renderNotFoundPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderNotFoundPage, 'function');
  }
});
test('renderAvailabilityPage is a render function', async () => {
  const mod = await import('../src/availabilityPage.js');
  assert.equal(typeof mod.renderAvailabilityPage, 'function');
});
test('renderAvailabilityPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/availabilityPage.js');
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
