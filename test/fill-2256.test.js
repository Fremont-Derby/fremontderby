import test from 'node:test';
import assert from 'node:assert/strict';
import { fill2256 } from '../src/fill2256.js';
test('fill 2256', () => { assert.equal(fill2256(true), true); });
