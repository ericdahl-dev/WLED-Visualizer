import { test } from 'vitest';
import assert from 'node:assert';

import { newRunGeometry, geometryMismatch } from '../html/livemirror.js';

// A run drawn while a device is connected should line up with what that
// device is actually driving, rather than an arbitrary 30 LEDs.
test('takes a new run geometry from the matching device segment', () => {
  const segments = [{ start: 0, len: 60 }, { start: 60, len: 84 }];

  assert.deepStrictEqual(
    newRunGeometry({ stripLen: 144, segments, runIndex: 0, previousEnd: 0 }),
    { startIndex: 0, ledCount: 60 }
  );
  assert.deepStrictEqual(
    newRunGeometry({ stripLen: 144, segments, runIndex: 1, previousEnd: 60 }),
    { startIndex: 60, ledCount: 84 }
  );
});

// Runs are often drawn before segments exist on the device, so past the last
// segment a run claims whatever is left of the strip.
test('claims the rest of the strip when no segment matches', () => {
  const segments = [{ start: 0, len: 60 }];

  assert.deepStrictEqual(
    newRunGeometry({ stripLen: 144, segments, runIndex: 1, previousEnd: 60 }),
    { startIndex: 60, ledCount: 84 }
  );
});

// Nothing connected means nothing to learn from, so the old default stands.
test('falls back to the default length with no device connected', () => {
  assert.deepStrictEqual(
    newRunGeometry({ stripLen: 0, segments: [], runIndex: 0, previousEnd: 0 }),
    { startIndex: 0, ledCount: 30 }
  );
});

// A strip already fully spoken for shouldn't hand back a zero-length run.
test('never returns an empty run', () => {
  const result = newRunGeometry({ stripLen: 144, segments: [], runIndex: 2, previousEnd: 144 });

  assert.strictEqual(result.startIndex, 144);
  assert.ok(result.ledCount >= 1, `got ${result.ledCount}`);
});

// Mirroring never rewrites a run's geometry on its own, because ledCount is
// layout the user drew and feeds the exported config. Instead the disagreement
// is surfaced so they can choose to adopt it.
test('reports how a run disagrees with its device segment', () => {
  const run = { startIndex: 0, ledCount: 30 };
  const seg = { start: 0, len: 144 };

  assert.deepStrictEqual(geometryMismatch(run, seg), { startIndex: 0, ledCount: 144 });
});

test('reports no mismatch when the run already agrees', () => {
  const run = { startIndex: 60, ledCount: 84 };
  const seg = { start: 60, len: 84 };

  assert.strictEqual(geometryMismatch(run, seg), null);
});

test('reports no mismatch when there is no segment to compare against', () => {
  assert.strictEqual(geometryMismatch({ startIndex: 0, ledCount: 30 }, null), null);
  assert.strictEqual(geometryMismatch({ startIndex: 0, ledCount: 30 }, undefined), null);
});
