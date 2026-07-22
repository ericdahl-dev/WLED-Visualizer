import { test } from 'vitest';
import assert from 'node:assert';

import {
  liveFrameColor,
  parseLiveFrame,
  isFrameFresh,
  applyDeviceState,
} from '../html/livemirror.js';

// Build a WLED live-view frame: 'L', format byte, then one colour per LED.
function frameOf(colours, format = 1) {
  const stride = format === 2 ? 4 : 3;
  const bytes = new Uint8Array(2 + colours.length * stride);
  bytes[0] = 0x4C;
  bytes[1] = format;
  colours.forEach((c, i) => {
    const o = 2 + i * stride;
    bytes[o] = c[0]; bytes[o + 1] = c[1]; bytes[o + 2] = c[2];
    if (stride === 4) bytes[o + 3] = c[3] || 0;
  });
  return { bytes, count: colours.length, stride };
}

test('reads the colour of an LED from a frame covering the whole strip', () => {
  const frame = frameOf([[255, 0, 0], [0, 255, 0], [0, 0, 255]]);

  assert.deepStrictEqual(liveFrameColor(frame, 0, 3), [255, 0, 0]);
  assert.deepStrictEqual(liveFrameColor(frame, 1, 3), [0, 255, 0]);
  assert.deepStrictEqual(liveFrameColor(frame, 2, 3), [0, 0, 255]);
});

// Long strips exceed WLED's live-view payload budget, so the device sends a
// downsampled frame and every LED has to find its colour by proportion.
test('spreads a downsampled frame across the full strip', () => {
  const frame = frameOf([[255, 0, 0], [0, 255, 0], [0, 0, 255]]);

  assert.deepStrictEqual(liveFrameColor(frame, 0, 6), [255, 0, 0]);
  assert.deepStrictEqual(liveFrameColor(frame, 1, 6), [255, 0, 0]);
  assert.deepStrictEqual(liveFrameColor(frame, 2, 6), [0, 255, 0]);
  assert.deepStrictEqual(liveFrameColor(frame, 3, 6), [0, 255, 0]);
  assert.deepStrictEqual(liveFrameColor(frame, 4, 6), [0, 0, 255]);
  assert.deepStrictEqual(liveFrameColor(frame, 5, 6), [0, 0, 255]);
});

// A run can be configured to run off the end of the strip, or start before it.
// Those LEDs have no colour to report rather than a wrong one.
test('reports no colour for LEDs outside the strip', () => {
  const frame = frameOf([[255, 0, 0], [0, 255, 0], [0, 0, 255]]);

  assert.strictEqual(liveFrameColor(frame, 3, 3), null);
  assert.strictEqual(liveFrameColor(frame, 99, 3), null);
  assert.strictEqual(liveFrameColor(frame, -1, 3), null);
});

test('parses an RGB frame into its LED colours', () => {
  const raw = frameOf([[255, 0, 0], [0, 255, 0]]).bytes;

  const frame = parseLiveFrame(raw.buffer);

  assert.strictEqual(frame.count, 2);
  assert.strictEqual(frame.stride, 3);
  assert.deepStrictEqual(liveFrameColor(frame, 1, 2), [0, 255, 0]);
});

// RGBW strips send a fourth byte per LED. The white channel isn't drawn, but
// it shifts where every subsequent colour starts.
test('parses an RGBW frame using a four byte stride', () => {
  const raw = frameOf([[255, 0, 0, 10], [0, 255, 0, 20]], 2).bytes;

  const frame = parseLiveFrame(raw.buffer);

  assert.strictEqual(frame.count, 2);
  assert.strictEqual(frame.stride, 4);
  assert.deepStrictEqual(liveFrameColor(frame, 1, 2), [0, 255, 0]);
});

// The socket carries whatever the device decides to send. Anything that isn't
// a live-view frame is refused rather than drawn as garbage colours.
test('refuses frames that are not live-view data', () => {
  const notLiveView = new Uint8Array([0x4A, 1, 255, 0, 0]);   // wrong magic byte
  const truncated = new Uint8Array([0x4C, 1]);                 // header, no LEDs
  const empty = new Uint8Array([]);

  assert.strictEqual(parseLiveFrame(notLiveView.buffer), null);
  assert.strictEqual(parseLiveFrame(truncated.buffer), null);
  assert.strictEqual(parseLiveFrame(empty.buffer), null);
});

// While frames flow the canvas paints real pixels; when they stop it has to
// notice and hand back to the local simulation instead of freezing.
test('treats a frame as stale once the device stops sending', () => {
  const arrivedAt = 1000;

  assert.strictEqual(isFrameFresh(arrivedAt, 1000), true);
  assert.strictEqual(isFrameFresh(arrivedAt, 2400), true);
  assert.strictEqual(isFrameFresh(arrivedAt, 2600), false);
  assert.strictEqual(isFrameFresh(arrivedAt, 60000), false);
});

test('has no fresh frame before the first one arrives', () => {
  assert.strictEqual(isFrameFresh(null, 1000), false);
});

// The app resolves effect ids and colour formats itself, so those are injected
// the same way effects.js takes its helpers.
function helpers() {
  return {
    effectValue: (fx) => ({ effect: 'wled_' + fx, effectLabel: 'Effect ' + fx, simKey: 'chase' }),
    rgbToHex: ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''),
  };
}

test('mirrors a device segment onto the matching run', () => {
  const runs = [{}];
  const state = {
    on: true,
    bri: 128,
    seg: [{
      fx: 26, pal: 5, sx: 200, ix: 60,
      col: [[0, 255, 120], [0, 0, 0], [0, 0, 0]],
      grp: 2, spc: 1, mi: true, rev: true, bri: 255, on: true,
    }],
  };

  applyDeviceState(state, runs, helpers());

  assert.strictEqual(runs[0].effect, 'wled_26');
  assert.strictEqual(runs[0].paletteId, 5);
  assert.strictEqual(runs[0].speed, 200);
  assert.strictEqual(runs[0].intensity, 60);
  assert.strictEqual(runs[0].color1, '#00ff78');
  assert.strictEqual(runs[0].grouping, 2);
  assert.strictEqual(runs[0].spacing, 1);
  assert.strictEqual(runs[0].mirror, true);
  assert.strictEqual(runs[0].reverse, true);
});

// Runs and segments are drawn up independently, so the two counts rarely
// agree. Only the overlap is mirrored; the rest is left alone.
test('mirrors only as many runs as the device has segments', () => {
  const runs = [{ name: 'first' }, { name: 'second' }, { name: 'untouched' }];
  const state = { on: true, bri: 128, seg: [{ pal: 1 }, { pal: 2 }] };

  const result = applyDeviceState(state, runs, helpers());

  assert.strictEqual(result.mirroredCount, 2);
  assert.strictEqual(runs[0].paletteId, 1);
  assert.strictEqual(runs[1].paletteId, 2);
  assert.strictEqual(runs[2].paletteId, undefined);
});

test('ignores device segments that have no run to mirror onto', () => {
  const runs = [{}];
  const state = { on: true, bri: 128, seg: [{ pal: 1 }, { pal: 2 }, { pal: 3 }] };

  const result = applyDeviceState(state, runs, helpers());

  assert.strictEqual(result.mirroredCount, 1);
  assert.strictEqual(result.segCount, 3);
  assert.strictEqual(runs[0].paletteId, 1);
});

// A run is only shown when the device would actually be lighting it: the
// controller powered on, and that segment not switched off on its own.
test('hides a run whose segment is switched off', () => {
  const runs = [{}, {}];
  const state = { on: true, bri: 128, seg: [{ on: true }, { on: false }] };

  applyDeviceState(state, runs, helpers());

  assert.strictEqual(runs[0].visible, true);
  assert.strictEqual(runs[1].visible, false);
});

test('hides every run while the controller is off', () => {
  const runs = [{}, {}];
  const state = { on: false, bri: 128, seg: [{ on: true }, { on: true }] };

  applyDeviceState(state, runs, helpers());

  assert.strictEqual(runs[0].visible, false);
  assert.strictEqual(runs[1].visible, false);
});

test('reports the device power and brightness it mirrored', () => {
  const state = { on: true, bri: 80, seg: [{ pal: 1 }] };

  const result = applyDeviceState(state, [{}], helpers());

  assert.strictEqual(result.on, true);
  assert.strictEqual(result.brightness, 80);
});
