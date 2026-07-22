import { test } from 'vitest';
import assert from 'node:assert';

import { EFFECT_RENDERERS, computeEffectColor, mirroredGroup } from '../html/effects.js';

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

// WLED's mirror halves the segment's virtual length and reflects it about the
// centre (FX_fcn.cpp: vLength = (vLength+1)/2, write to both x and len-1-x).
// The sim previously edited/exported mirror but ignored it when drawing.
test('mirrored groups reflect about the segment centre', () => {
  // 4 groups -> effect sees 2, layout is 0,1,1,0
  assert.deepStrictEqual(
    [0, 1, 2, 3].map((g) => mirroredGroup(g, 4)),
    [{ index: 0, count: 2 }, { index: 1, count: 2 }, { index: 1, count: 2 }, { index: 0, count: 2 }]
  );
  // odd length: middle LED is its own mirror
  assert.deepStrictEqual(
    [0, 1, 2, 3, 4].map((g) => mirroredGroup(g, 5).index),
    [0, 1, 2, 1, 0]
  );
});

// FX.cpp: Android is one contiguous block that grows in place, then shrinks
// while advancing — the size oscillation is what makes it Android.
test('android is one block whose size breathes over time', () => {
  assert.ok(EFFECT_RENDERERS.android, 'no android renderer');

  const sizes = [1, 3, 5, 7].map((t) => strip('android', 60, t).filter((c) => lum(c) > 60).length);

  assert.ok(sizes.every((n) => n > 0 && n < 60), `block missing or full-strip: ${sizes}`);
  assert.ok(new Set(sizes).size > 1, `size never changes: ${sizes}`);
  assert.strictEqual(clusters(strip('android', 60, 3), 60), 1, 'not contiguous');
});

// FX.cpp chase(): Chase Random picks a new wheel colour each lap — the
// background hue changes, the marching bands stay.
test('chase random changes its background colour between laps', () => {
  assert.ok(EFFECT_RENDERERS.chaseRandom, 'no chaseRandom renderer');

  const bgAt = (t) => {
    const leds = strip('chaseRandom', 60, t);
    const counts = {};
    for (const c of leds) { const k = c.map(Math.round).join(','); counts[k] = (counts[k] || 0) + 1; }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]; // dominant colour
  };

  assert.notStrictEqual(bgAt(1), bgAt(40), 'background never changes');
});

// Chase Rainbow: same chase, background hue cycling continuously.
test('chase rainbow cycles its background hue', () => {
  assert.ok(EFFECT_RENDERERS.chaseRainbow, 'no chaseRainbow renderer');

  const domAt = (t) => {
    const counts = {};
    for (const c of strip('chaseRainbow', 60, t)) { const k = c.map(Math.round).join(','); counts[k] = (counts[k] || 0) + 1; }
    const dom = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { key: dom[0], lum: dom[0].split(',').reduce((s, v) => s + +v, 0) };
  };

  const a = domAt(1), b = domAt(4);
  assert.ok(a.lum > 60 && b.lum > 60, 'background dark');
  assert.notStrictEqual(a.key, b.key, 'hue never moves');
});

// FX.cpp mode_chase_flash: background everywhere, and a two-LED white flash
// that blinks a few times at one spot before moving on.
test('chase flash is background plus an intermittent white pair', () => {
  assert.ok(EFFECT_RENDERERS.chaseFlash, 'no chaseFlash renderer');

  let flashSeen = 0, quietSeen = 0;
  for (let t = 0; t < 6; t += 0.1) {
    const white = strip('chaseFlash', 60, t).filter(([r, g, b]) => r > 200 && g > 200 && b > 200).length;
    if (white > 0 && white <= 6) flashSeen++;
    if (white === 0) quietSeen++;
  }
  assert.ok(flashSeen > 0, 'never flashes');
  assert.ok(quietSeen > 0, 'flash never turns off');
});

// Rainbow Runner (mode_chase_rainbow_white): the background itself is a
// rainbow along the strip, with the chase bands running over it.
test('rainbow runner carries many hues at a single instant', () => {
  assert.ok(EFFECT_RENDERERS.rainbowRunner, 'no rainbowRunner renderer');

  const hues = new Set(
    strip('rainbowRunner', 60, 2)
      .filter((c) => lum(c) > 100)
      .map(([r, g, b]) => Math.round(Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 6 / Math.PI))
  );

  assert.ok(hues.size >= 5, `only ${hues.size} distinct hues — not a rainbow`);
});
