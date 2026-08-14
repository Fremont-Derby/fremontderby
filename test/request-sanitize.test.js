import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readSanitizedJsonBody,
  safeClientErrorMessage,
  sanitizeText,
  requireUuid,
  MAX_JSON_BODY_BYTES,
} from '../src/requestSanitize.js';

function fakeRequest(body, headers = {}) {
  return {
    headers: {
      get(name) {
        const key = String(name).toLowerCase();
        const found = Object.entries(headers).find(([k]) => k.toLowerCase() === key);
        return found ? found[1] : null;
      },
    },
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body);
    },
  };
}

test('accepts normal JSON objects', async () => {
  const body = await readSanitizedJsonBody(fakeRequest({ title: 'Hello', body: 'World' }));
  assert.equal(body.title, 'Hello');
});

test('rejects oversized bodies', async () => {
  const huge = 'x'.repeat(MAX_JSON_BODY_BYTES + 10);
  await assert.rejects(
    () => readSanitizedJsonBody(fakeRequest(huge)),
    /too large/,
  );
});

test('rejects invalid JSON and non-objects', async () => {
  await assert.rejects(() => readSanitizedJsonBody(fakeRequest('not-json')), /valid JSON/);
  await assert.rejects(() => readSanitizedJsonBody(fakeRequest([1, 2, 3])), /JSON object/);
});

test('rejects deep nesting', async () => {
  let nest = { a: 1 };
  for (let i = 0; i < 20; i += 1) nest = { child: nest };
  await assert.rejects(() => readSanitizedJsonBody(fakeRequest(nest)), /deeply nested/);
});

test('sanitizeText scrubs controls and enforces length', () => {
  assert.equal(sanitizeText('  ok\u0000there  ', { maxLength: 20 }), 'okthere');
  assert.throws(() => sanitizeText('x'.repeat(50), { maxLength: 10, field: 'title' }), /10 characters/);
});

test('requireUuid and safe errors', () => {
  assert.throws(() => requireUuid('nope'), /Invalid/);
  assert.match(
    safeClientErrorMessage({ message: 'permission denied for schema private' }),
    /could not complete that action/i,
  );
  assert.match(safeClientErrorMessage({ message: 'Request body is too large', status: 413 }), /too large/i);
});
