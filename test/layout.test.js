import { test } from 'vitest';
import assert from 'node:assert';

import { stripLayout } from '../html/livemirror.js';

// startIndex chaining happens once, at add time. Nothing re-checks it after
// reorder, delete or resize — so the export can carry overlapping segments.
// stripLayout is the derived, always-current view of what the runs claim.
test('a cleanly chained layout reports no conflicts', () => {
  const runs = [
    { startIndex: 0, ledCount: 30 },
    { startIndex: 30, ledCount: 20 },
  ];

  const layout = stripLayout(runs);

  assert.deepStrictEqual(layout.overlaps, []);
  assert.deepStrictEqual(layout.gaps, []);
});

test('reports which runs claim the same LEDs', () => {
  const runs = [
    { startIndex: 0, ledCount: 50 },   // grew after run 2 was added
    { startIndex: 30, ledCount: 20 },
  ];

  const layout = stripLayout(runs);

  assert.deepStrictEqual(layout.overlaps, [
    { runs: [0, 1], start: 30, count: 20 },
  ]);
});

// A gap means LEDs on the strip no run claims — after a delete, they'd keep
// playing whatever the controller last had there.
test('reports unclaimed LEDs between runs', () => {
  const runs = [
    { startIndex: 0, ledCount: 20 },
    { startIndex: 30, ledCount: 20 },  // run between them was deleted
  ];

  const layout = stripLayout(runs);

  assert.deepStrictEqual(layout.gaps, [{ start: 20, count: 10 }]);
  assert.deepStrictEqual(layout.overlaps, []);
});

test('single run and empty project report nothing', () => {
  assert.deepStrictEqual(stripLayout([{ startIndex: 5, ledCount: 10 }]), { overlaps: [], gaps: [] });
  assert.deepStrictEqual(stripLayout([]), { overlaps: [], gaps: [] });
});

// The repro from the issue: reorder two chained runs.
test('reordering chained runs alone is not a conflict', () => {
  const runs = [
    { startIndex: 30, ledCount: 20 },  // moved above
    { startIndex: 0, ledCount: 30 },
  ];

  const layout = stripLayout(runs);

  assert.deepStrictEqual(layout.overlaps, []);
  assert.deepStrictEqual(layout.gaps, []);
});
