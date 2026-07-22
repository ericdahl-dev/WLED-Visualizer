import { test } from 'vitest';
import assert from 'node:assert';

import { EFFECT_RENDERERS, computeEffectColor } from '../html/effects.js';

// The real helpers the app ships — not copies. getPaletteStops stays a stub
// because it reads app palette state; these tests use content colours.
import { clamp, lerpRgb, hexToRgb, hsl2rgb, hash01 } from '../html/color.js';

const helpers = {
  clamp,
  lerpRgb,
  hexToRgb,
  hsl2rgb,
  hash01,
  getPaletteStops: () => null,
  sampleGradientStops: (stops, f) => [f * 255, f * 255, f * 255],
};

function run(over = {}) {
  return {
    speed: 128, intensity: 128,
    color1: '#ff0000', color2: '#000000', color3: '#0000ff',
    paletteId: 0,
    ...over,
  };
}

// Brightness of a rendered LED, for comparing one position against another.
function lum(rgb) {
  return rgb[0] + rgb[1] + rgb[2];
}

// Render a whole strip at one instant.
function strip(simKey, n, t, over = {}) {
  const r = run({ ...over, simKey });
  return Array.from({ length: n }, (_, i) => computeEffectColor(r, i, n, t, helpers));
}

// A meteor is a bright head dragging a fading tail — the thing that makes it
// read as a meteor rather than a dot.
test('meteor fades behind its head', () => {
  assert.ok(EFFECT_RENDERERS.meteor, 'no meteor renderer');

  const leds = strip('meteor', 60, 3);
  const head = leds.reduce((best, rgb, i) => (lum(rgb) > lum(leds[best]) ? i : best), 0);

  const behind = (head - 4 + 60) % 60;
  const further = (head - 12 + 60) % 60;

  assert.ok(lum(leds[behind]) < lum(leds[head]), 'tail not dimmer than head');
  assert.ok(lum(leds[further]) < lum(leds[behind]), 'tail does not keep fading');
});

// Head position of the brightest LED, for tracking a moving dot over time.
function headAt(simKey, n, t, over = {}) {
  const leds = strip(simKey, n, t, over);
  return leds.reduce((best, rgb, i) => (lum(rgb) > lum(leds[best]) ? i : best), 0);
}

// Sinelon swings back and forth rather than running one way and wrapping.
// That reversal is the whole character of the effect.
test('sinelon reverses direction instead of wrapping', () => {
  assert.ok(EFFECT_RENDERERS.sinelon, 'no sinelon renderer');

  const path = [];
  for (let t = 0; t < 12; t += 0.25) path.push(headAt('sinelon', 60, t));

  const wentUp = path.some((p, i) => i > 0 && p > path[i - 1]);
  const wentDown = path.some((p, i) => i > 0 && p < path[i - 1]);

  assert.ok(wentUp && wentDown, `never reversed: ${path.join(',')}`);
  assert.ok(Math.max(...path) > Math.min(...path) + 5, 'barely moved');
});

// Police is red and blue by definition — it ignores the run's own colors,
// which is the one effect where that's correct rather than a bug.
test('police shows red and blue at once, whatever colors the run has', () => {
  assert.ok(EFFECT_RENDERERS.police, 'no police renderer');

  const leds = strip('police', 60, 2, { color1: '#00ff00', color2: '#00ff00' });
  const reddish = leds.filter(([r, g, b]) => r > 120 && g < 80 && b < 80);
  const bluish = leds.filter(([r, g, b]) => b > 120 && r < 80 && g < 80);

  assert.ok(reddish.length > 0, 'no red LEDs');
  assert.ok(bluish.length > 0, 'no blue LEDs');
});

// Rain is a few drops, not a band of light. If most of the strip is lit it
// reads as a wipe, which is what it looked like on the chase fallback.
test('rain lights a sparse scatter of drops', () => {
  assert.ok(EFFECT_RENDERERS.rain, 'no rain renderer');

  const leds = strip('rain', 60, 4);
  const litFraction = leds.filter((rgb) => lum(rgb) > 60).length / leds.length;

  assert.ok(litFraction > 0, 'nothing lit at all');
  assert.ok(litFraction < 0.5, `too dense to read as rain: ${litFraction}`);
});

test('rain drops move along the strip over time', () => {
  const at = (t) => strip('rain', 60, t).map((rgb) => (lum(rgb) > 60 ? 1 : 0)).join('');

  assert.notStrictEqual(at(4), at(6), 'rain is frozen');
});

// Count separate lit clusters, so "two dots" can be told from "one dot".
function clusters(leds, threshold = 60) {
  const lit = leds.map((rgb) => lum(rgb) > threshold);
  let count = 0;
  for (let i = 0; i < lit.length; i++) {
    if (lit[i] && !lit[(i - 1 + lit.length) % lit.length]) count++;
  }
  return count;
}

test('two dots shows two separate dots', () => {
  assert.ok(EFFECT_RENDERERS.twoDots, 'no twoDots renderer');

  const leds = strip('twoDots', 60, 3);

  assert.strictEqual(clusters(leds), 2);
});

// Tri Chase cycles three colors along the strip, so a snapshot contains all
// three rather than the two a plain chase gives you.
test('tri chase uses all three run colors', () => {
  assert.ok(EFFECT_RENDERERS.triChase, 'no triChase renderer');

  const leds = strip('triChase', 60, 2, {
    color1: '#ff0000', color2: '#00ff00', color3: '#0000ff',
  });
  const has = (pick) => leds.some(pick);

  assert.ok(has(([r, g, b]) => r > 120 && g < 80 && b < 80), 'no color1');
  assert.ok(has(([r, g, b]) => g > 120 && r < 80 && b < 80), 'no color2');
  assert.ok(has(([r, g, b]) => b > 120 && r < 80 && g < 80), 'no color3');
});

// The point of Multi Comet is more than one comet on the strip at a time.
test('multi comet puts several comets on the strip', () => {
  assert.ok(EFFECT_RENDERERS.multiComet, 'no multiComet renderer');

  const leds = strip('multiComet', 90, 3);

  assert.ok(clusters(leds) >= 2, `only ${clusters(leds)} comet(s)`);
});

// Real WLED Loading is gradient_base(true): a bright peak that travels and
// wraps, fading behind it — not the progress bar it looks like by name.
// (Checked against FX.cpp rather than guessed.)
test('loading sweeps a bright peak that fades behind it', () => {
  assert.ok(EFFECT_RENDERERS.loading, 'no loading renderer');

  const leds = strip('loading', 60, 2);
  const peak = leds.reduce((best, rgb, i) => (lum(rgb) > lum(leds[best]) ? i : best), 0);

  const behind = (peak - 5 + 60) % 60;
  const further = (peak - 15 + 60) % 60;

  assert.ok(lum(leds[behind]) < lum(leds[peak]), 'no falloff behind the peak');
  assert.ok(lum(leds[further]) < lum(leds[behind]), 'falloff does not continue');
});

test('loading peak travels along the strip', () => {
  const peakAt = (t) => {
    const leds = strip('loading', 60, t);
    return leds.reduce((best, rgb, i) => (lum(rgb) > lum(leds[best]) ? i : best), 0);
  };

  assert.notStrictEqual(peakAt(1), peakAt(3), 'peak does not move');
});

// Stream is a continuous flow of color along the strip — everything lit,
// varying smoothly, rather than discrete dots against a dark background.
test('stream lights the whole strip and flows along it', () => {
  assert.ok(EFFECT_RENDERERS.stream, 'no stream renderer');

  const leds = strip('stream', 60, 2);
  const dark = leds.filter((rgb) => lum(rgb) < 20).length;

  assert.ok(dark < 12, `too much dead strip for a stream: ${dark}`);

  const before = strip('stream', 60, 2).map(lum).join(',');
  const after = strip('stream', 60, 4).map(lum).join(',');
  assert.notStrictEqual(before, after, 'stream is not moving');
});
