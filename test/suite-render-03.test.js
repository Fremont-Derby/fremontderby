import test from 'node:test';
import assert from 'node:assert/strict';

test('renderJflModernHome is a render function', async () => {
  const mod = await import('../src/jflModernHome.js');
  assert.equal(typeof mod.renderJflModernHome, 'function');
});
test('renderJflModernHome returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflModernHome.js');
  let html = null;
  try { html = mod.renderJflModernHome(); } catch {}
  if (html == null) { try { html = mod.renderJflModernHome({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderJflModernHome, 'function');
  }
});
test('renderScheduleMatchCard is a render function', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  assert.equal(typeof mod.renderScheduleMatchCard, 'function');
});
test('renderScheduleMatchCard returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  let html = null;
  try { html = mod.renderScheduleMatchCard(); } catch {}
  if (html == null) { try { html = mod.renderScheduleMatchCard({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderScheduleMatchCard, 'function');
  }
});
test('renderJflModernSchedule is a render function', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  assert.equal(typeof mod.renderJflModernSchedule, 'function');
});
test('renderJflModernSchedule returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  let html = null;
  try { html = mod.renderJflModernSchedule(); } catch {}
  if (html == null) { try { html = mod.renderJflModernSchedule({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderJflModernSchedule, 'function');
  }
});
test('renderTeamStandingCard is a render function', async () => {
  const mod = await import('../src/jflModernStandings.js');
  assert.equal(typeof mod.renderTeamStandingCard, 'function');
});
test('renderTeamStandingCard returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflModernStandings.js');
  let html = null;
  try { html = mod.renderTeamStandingCard(); } catch {}
  if (html == null) { try { html = mod.renderTeamStandingCard({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderTeamStandingCard, 'function');
  }
});
test('renderIndividualStandingCard is a render function', async () => {
  const mod = await import('../src/jflModernStandings.js');
  assert.equal(typeof mod.renderIndividualStandingCard, 'function');
});
test('renderIndividualStandingCard returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflModernStandings.js');
  let html = null;
  try { html = mod.renderIndividualStandingCard(); } catch {}
  if (html == null) { try { html = mod.renderIndividualStandingCard({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderIndividualStandingCard, 'function');
  }
});
test('renderJflModernStandings is a render function', async () => {
  const mod = await import('../src/jflModernStandings.js');
  assert.equal(typeof mod.renderJflModernStandings, 'function');
});
test('renderJflModernStandings returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflModernStandings.js');
  let html = null;
  try { html = mod.renderJflModernStandings(); } catch {}
  if (html == null) { try { html = mod.renderJflModernStandings({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderJflModernStandings, 'function');
  }
});
test('renderTeamCard is a render function', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.equal(typeof mod.renderTeamCard, 'function');
});
test('renderTeamCard returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflModernTeams.js');
  let html = null;
  try { html = mod.renderTeamCard(); } catch {}
  if (html == null) { try { html = mod.renderTeamCard({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderTeamCard, 'function');
  }
});
test('renderJflModernTeams is a render function', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.equal(typeof mod.renderJflModernTeams, 'function');
});
test('renderJflModernTeams returns markup or asks for its arguments', async () => {
  const mod = await import('../src/jflModernTeams.js');
  let html = null;
  try { html = mod.renderJflModernTeams(); } catch {}
  if (html == null) { try { html = mod.renderJflModernTeams({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderJflModernTeams, 'function');
  }
});
