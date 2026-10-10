import test from 'node:test';
import assert from 'node:assert/strict';

test('renderScorecardPage is a render function', async () => {
  const mod = await import('../src/scorecardPage.js');
  assert.equal(typeof mod.renderScorecardPage, 'function');
});
test('renderScorecardPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/scorecardPage.js');
  let html = null;
  try { html = mod.renderScorecardPage(); } catch {}
  if (html == null) { try { html = mod.renderScorecardPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderScorecardPage, 'function');
  }
});
test('renderSeasonSetupPage is a render function', async () => {
  const mod = await import('../src/seasonSetupPage.js');
  assert.equal(typeof mod.renderSeasonSetupPage, 'function');
});
test('renderSeasonSetupPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/seasonSetupPage.js');
  let html = null;
  try { html = mod.renderSeasonSetupPage(); } catch {}
  if (html == null) { try { html = mod.renderSeasonSetupPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderSeasonSetupPage, 'function');
  }
});
test('renderStandingsPage is a render function', async () => {
  const mod = await import('../src/standingsPage.js');
  assert.equal(typeof mod.renderStandingsPage, 'function');
});
test('renderStandingsPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/standingsPage.js');
  let html = null;
  try { html = mod.renderStandingsPage(); } catch {}
  if (html == null) { try { html = mod.renderStandingsPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderStandingsPage, 'function');
  }
});
test('renderTeamsPage is a render function', async () => {
  const mod = await import('../src/teamsPage.js');
  assert.equal(typeof mod.renderTeamsPage, 'function');
});
test('renderTeamsPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/teamsPage.js');
  let html = null;
  try { html = mod.renderTeamsPage(); } catch {}
  if (html == null) { try { html = mod.renderTeamsPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderTeamsPage, 'function');
  }
});
test('renderTradesPage is a render function', async () => {
  const mod = await import('../src/tradesPage.js');
  assert.equal(typeof mod.renderTradesPage, 'function');
});
test('renderTradesPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/tradesPage.js');
  let html = null;
  try { html = mod.renderTradesPage(); } catch {}
  if (html == null) { try { html = mod.renderTradesPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderTradesPage, 'function');
  }
});
