import test from 'node:test';
import assert from 'node:assert/strict';

test('chatCommands.js exports listDirectMessageInboxCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listDirectMessageInboxCommand, 'function');
});
test('chatCommands.js exports startDirectConversationCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.startDirectConversationCommand, 'function');
});
test('chatCommands.js exports listDirectMessagesCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listDirectMessagesCommand, 'function');
});
test('chatCommands.js exports sendDirectMessageCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.sendDirectMessageCommand, 'function');
});
test('chatCommands.js exports markDirectChatReadCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.markDirectChatReadCommand, 'function');
});
test('chatCommands.js exports blockPlayerChatCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.blockPlayerChatCommand, 'function');
});
test('chatCommands.js exports unblockPlayerChatCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.unblockPlayerChatCommand, 'function');
});
test('chatCommands.js exports listBlockedChatPlayersCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listBlockedChatPlayersCommand, 'function');
});
test('chatCommands.js exports listLeagueChatThreadsCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listLeagueChatThreadsCommand, 'function');
});
test('chatCommands.js exports listLeagueMessagesCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listLeagueMessagesCommand, 'function');
});
test('chatCommands.js exports sendLeagueMessageCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.sendLeagueMessageCommand, 'function');
});
test('chatCommands.js exports markLeagueChatReadCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.markLeagueChatReadCommand, 'function');
});
