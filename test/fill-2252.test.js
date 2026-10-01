import test from 'node:test';
import assert from 'node:assert/strict';
import { fill2252 } from '../src/fill2252.js';
test('fill 2252', () => { assert.equal(fill2252(true), true); });
