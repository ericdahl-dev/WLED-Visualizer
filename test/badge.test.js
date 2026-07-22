// @vitest-environment happy-dom

import { test } from 'vitest';
import assert from 'node:assert';

import { renderLiveBadge } from '../html/livemirror.js';

function badge() {
  const el = document.createElement('span');
  el.textContent = '● LIVE';
  el.style.display = 'none';
  return el;
}

// The badge is the only thing telling you whether the canvas is showing real
// device pixels or a local approximation, so the two states must be distinct.
test('marks the badge as pixel-exact while painting device pixels', () => {
  const el = badge();

  renderLiveBadge(el, {
    mirroring: true, pixelExact: true, pixelCount: 144,
    mirroredCount: 1, segCount: 1, runCount: 1,
  });

  assert.strictEqual(el.textContent, '● LIVE · PIXEL');
  assert.match(el.title, /144/);
  assert.notStrictEqual(el.style.display, 'none');
});

test('says plainly when effects are only being simulated', () => {
  const el = badge();

  renderLiveBadge(el, {
    mirroring: true, pixelExact: false, pixelCount: 0,
    mirroredCount: 1, segCount: 1, runCount: 1,
  });

  assert.strictEqual(el.textContent, '● LIVE');
  assert.match(el.title, /simulated locally/);
});

test('hides the badge when mirroring is off', () => {
  const el = badge();
  renderLiveBadge(el, { mirroring: true, pixelExact: true, pixelCount: 144, mirroredCount: 1, segCount: 1, runCount: 1 });

  renderLiveBadge(el, { mirroring: false });

  assert.strictEqual(el.style.display, 'none');
});

// Regression: the badge markup carries a bullet, and rewriting textContent
// once dropped it, leaving a bare "LIVE" with no status dot.
test('keeps the status dot in every state', () => {
  const el = badge();

  for (const status of [
    { mirroring: true, pixelExact: true, pixelCount: 144, mirroredCount: 1, segCount: 1, runCount: 1 },
    { mirroring: true, pixelExact: false, pixelCount: 0, mirroredCount: 1, segCount: 1, runCount: 1 },
    { mirroring: false },
  ]) {
    renderLiveBadge(el, status);
    assert.ok(el.textContent.startsWith('●'), `lost the dot: ${el.textContent}`);
  }
});
