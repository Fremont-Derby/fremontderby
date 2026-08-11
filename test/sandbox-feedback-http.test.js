import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandboxFeedbackHttpHandlers } from '../src/sandboxFeedbackHttp.js';

function handlersFor(actorId, repository) {
  return createSandboxFeedbackHttpHandlers({
    authenticate: async () => ({ id: actorId }),
    createRepository: () => repository,
  });
}

test('authenticated tester submits contextual sandbox feedback', async () => {
  const calls = [];
  const repository = {
    async submitSandboxFeedback(payload) {
      calls.push(payload);
      return { id: 'feedback-1', status: 'open' };
    },
  };
  const handlers = handlersFor('user-1', repository);
  const response = await handlers.submit(new Request('https://fremontderby.com/api/sandbox-feedback', {
    method: 'POST',
    body: JSON.stringify({
      surface: 'player',
      path: '/sandbox/player',
      context: { phase: 'mismatch', mismatchRack: 2 },
      comment: 'The correction step was unclear.',
    }),
  }), {});

  assert.equal(response.status, 201);
  assert.deepEqual(calls, [{
    actorUserId: 'user-1',
    surface: 'player',
    path: '/sandbox/player',
    context: { phase: 'mismatch', mismatchRack: 2 },
    comment: 'The correction step was unclear.',
  }]);
});

test('admin list and resolve handlers pass actor identity to trusted repository', async () => {
  const calls = [];
  const repository = {
    async listSandboxFeedback(payload) {
      calls.push(['list', payload]);
      return [{ id: 'feedback-1', status: 'open' }];
    },
    async resolveSandboxFeedback(payload) {
      calls.push(['resolve', payload]);
      return { id: payload.feedbackId, status: 'reviewed' };
    },
  };
  const handlers = handlersFor('admin-1', repository);
  const list = await handlers.list(new Request('https://fremontderby.com/api/admin/sandbox-feedback?status=open&limit=25'), {});
  const resolve = await handlers.resolve(new Request('https://fremontderby.com/api/admin/sandbox-feedback/feedback-1/resolve', { method: 'POST' }), {}, 'feedback-1');

  assert.equal(list.status, 200);
  assert.equal(resolve.status, 200);
  assert.deepEqual(calls, [
    ['list', { actorUserId: 'admin-1', status: 'open', limit: 25 }],
    ['resolve', { actorUserId: 'admin-1', feedbackId: 'feedback-1' }],
  ]);
});

test('invalid sandbox feedback is rejected before persistence', async () => {
  let called = false;
  const handlers = handlersFor('user-1', {
    async submitSandboxFeedback() {
      called = true;
    },
  });
  const response = await handlers.submit(new Request('https://fremontderby.com/api/sandbox-feedback', {
    method: 'POST',
    body: JSON.stringify({ surface: 'player', path: '/sandbox/player', context: {}, comment: '' }),
  }), {});

  assert.equal(response.status, 400);
  assert.equal(called, false);
});
