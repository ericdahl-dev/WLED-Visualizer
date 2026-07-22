import { test } from 'vitest';
import assert from 'node:assert';

import { importRuns } from '../html/livemirror.js';
import { rgbArrToHex } from '../html/color.js';

// The app owns run creation — ids, names, colour cycling — so it hands over a
// factory, the same way it hands over effect and colour helpers.
function deps() {
  let n = 0;
  return {
    createRun: () => ({ id: 'run-' + (n++), points: [] }),
    helpers: {
      effectValue: (fx) => ({ effect: 'wled_' + fx, effectLabel: 'Effect ' + fx, simKey: 'chase' }),
      rgbToHex: rgbArrToHex,
    },
  };
}

// Someone with a display already built in WLED shouldn't have to retype its
// structure into the app before it's any use to them.
test('creates a run for every device segment when the project is empty', () => {
  const runs = [];
  const state = { on: true, bri: 128, seg: [{ start: 0, len: 50 }, { start: 50, len: 94 }] };

  const result = importRuns(state, runs, deps());

  assert.strictEqual(result.imported, 2);
  assert.strictEqual(runs.length, 2);
});

// The whole point is that the controller already knows where each segment
// sits, so an imported run shouldn't need those numbers typed in.
test('each imported run takes its bounds from its segment', () => {
  const runs = [];
  const state = { on: true, bri: 128, seg: [{ start: 0, len: 50 }, { start: 50, len: 94 }] };

  importRuns(state, runs, deps());

  assert.strictEqual(runs[0].startIndex, 0);
  assert.strictEqual(runs[0].ledCount, 50);
  assert.strictEqual(runs[1].startIndex, 50);
  assert.strictEqual(runs[1].ledCount, 94);
});

// An imported run should look like what the controller is already showing,
// otherwise you've only imported half the configuration.
test('imported runs carry the device effect, palette and colours', () => {
  const runs = [];
  const state = {
    on: true,
    bri: 128,
    seg: [{ start: 0, len: 50, fx: 26, pal: 5, sx: 200, ix: 60, col: [[0, 255, 120], [0, 0, 0], [0, 0, 0]] }],
  };

  importRuns(state, runs, deps());

  assert.strictEqual(runs[0].effect, 'wled_26');
  assert.strictEqual(runs[0].paletteId, 5);
  assert.strictEqual(runs[0].speed, 200);
  assert.strictEqual(runs[0].intensity, 60);
  assert.strictEqual(runs[0].color1, '#00ff78');
});

// The controller has no idea where a strip physically hangs, so the paths
// traced onto the photo exist only here. Importing must never cost them.
test('leaves the paths already drawn on existing runs alone', () => {
  const drawn = [{ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }];
  const runs = [{ id: 'mine', points: drawn, startIndex: 0, ledCount: 50, name: 'Porch' }];
  const state = { on: true, bri: 128, seg: [{ start: 0, len: 50 }, { start: 50, len: 94 }] };

  const result = importRuns(state, runs, deps());

  assert.strictEqual(result.imported, 1);
  assert.strictEqual(runs.length, 2);
  assert.deepStrictEqual(runs[0].points, drawn, 'existing path was modified');
  assert.strictEqual(runs[0].name, 'Porch');
  assert.strictEqual(runs[0].startIndex, 0);
  assert.strictEqual(runs[0].ledCount, 50);
  assert.strictEqual(runs[1].startIndex, 50);
});

test('imports nothing when every segment already has a run', () => {
  const runs = [{ id: 'a', points: [] }];
  const state = { on: true, bri: 128, seg: [{ start: 0, len: 50 }] };

  const result = importRuns(state, runs, deps());

  assert.strictEqual(result.imported, 0);
  assert.strictEqual(runs.length, 1);
});

test('imports nothing from a device reporting no segments', () => {
  const runs = [];

  assert.strictEqual(importRuns({ on: true, bri: 128, seg: [] }, runs, deps()).imported, 0);
  assert.strictEqual(importRuns({ on: true, bri: 128 }, runs, deps()).imported, 0);
  assert.strictEqual(runs.length, 0);
});
