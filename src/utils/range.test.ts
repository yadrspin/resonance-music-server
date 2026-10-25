import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRangeHeader } from './range.js';

test('range - parses explicit byte ranges', () => {
  const result = parseRangeHeader('bytes=0-1023', 5000);
  assert.deepEqual(result, {
    start: 0,
    end: 1023,
    chunkSize: 1024,
  });
});

test('range - parses open-ended start range', () => {
  const result = parseRangeHeader('bytes=1000-', 5000);
  assert.deepEqual(result, {
    start: 1000,
    end: 4999,
    chunkSize: 4000,
  });
});

test('range - parses suffix byte range', () => {
  const result = parseRangeHeader('bytes=-500', 5000);
  assert.deepEqual(result, {
    start: 4500,
    end: 4999,
    chunkSize: 500,
  });
});

test('range - clamps end to total size minus 1', () => {
  const result = parseRangeHeader('bytes=4000-8000', 5000);
  assert.deepEqual(result, {
    start: 4000,
    end: 4999,
    chunkSize: 1000,
  });
});

test('range - returns null on invalid or unsatisfiable range', () => {
  assert.equal(parseRangeHeader('bytes=5000-6000', 5000), null);
  assert.equal(parseRangeHeader('bytes=3000-2000', 5000), null);
  assert.equal(parseRangeHeader('invalid-range', 5000), null);
  assert.equal(parseRangeHeader(undefined, 5000), null);
  assert.equal(parseRangeHeader('bytes=0-100', 0), null);
});
