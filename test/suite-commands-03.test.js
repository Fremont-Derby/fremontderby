import test from 'node:test';
import assert from 'node:assert/strict';

test('chatCommands.js exports reportChatMessageCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.reportChatMessageCommand, 'function');
});
test('chatCommands.js exports listChatReportsCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listChatReportsCommand, 'function');
});
test('chatCommands.js exports moderateChatReportCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.moderateChatReportCommand, 'function');
});
test('chatCommands.js exports listMatchupChatThreadsCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listMatchupChatThreadsCommand, 'function');
});
test('chatCommands.js exports listMatchupMessagesCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listMatchupMessagesCommand, 'function');
});
test('chatCommands.js exports sendMatchupMessageCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.sendMatchupMessageCommand, 'function');
});
test('chatCommands.js exports markMatchupChatReadCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.markMatchupChatReadCommand, 'function');
});
test('dualScoringCommands.js exports getPlayerMatchScoreComparisonCommand as a function', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.equal(typeof mod.getPlayerMatchScoreComparisonCommand, 'function');
});
test('dualScoringCommands.js exports setPlayerMatchOpeningDisciplineCommand as a function', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.equal(typeof mod.setPlayerMatchOpeningDisciplineCommand, 'function');
});
test('dualScoringCommands.js exports recordPlayerMatchScoreRackCommand as a function', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.equal(typeof mod.recordPlayerMatchScoreRackCommand, 'function');
});
test('dualScoringCommands.js exports updatePlayerMatchScoreRackCommand as a function', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.equal(typeof mod.updatePlayerMatchScoreRackCommand, 'function');
});
test('dualScoringCommands.js exports undoPlayerMatchScoreRackCommand as a function', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.equal(typeof mod.undoPlayerMatchScoreRackCommand, 'function');
});
