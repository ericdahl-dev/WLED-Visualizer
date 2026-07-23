/* Live Mirror: turning a WLED device's live output into something the canvas
   can draw. Kept free of DOM and socket concerns so the protocol logic can be
   exercised on its own, the same way effects.js keeps color maths separate. */

// How long a frame stays usable. Long enough to ride out a dropped frame on a
// busy network, short enough that a dead feed doesn't leave the canvas frozen.
const LIVE_PIXEL_STALE_MS = 1500;

// Whether the last frame is recent enough to keep painting from.
function isFrameFresh(arrivedAt, now) {
  if (arrivedAt === null || arrivedAt === undefined) return false;
  return (now - arrivedAt) < LIVE_PIXEL_STALE_MS;
}

// A WLED live-view frame: 'L', a format byte, then one color per LED.
function parseLiveFrame(buf) {
  const bytes = new Uint8Array(buf);
  if (bytes.length < 3 || bytes[0] !== 0x4C) return null;
  const stride = bytes[1] === 2 ? 4 : 3;
  const count = Math.floor((bytes.length - 2) / stride);
  if (count < 1) return null;
  return { bytes, count, stride };
}

// Color of a controller LED index within a live frame. The frame may carry
// fewer LEDs than the strip has, since WLED downsamples long strips to keep
// the payload small, so indices are mapped by proportion rather than 1:1.
function liveFrameColor(frame, deviceIdx, stripLen) {
  if (deviceIdx < 0 || deviceIdx >= stripLen) return null;
  let i = deviceIdx;
  if (frame.count < stripLen) i = Math.floor(deviceIdx * frame.count / stripLen);
  const o = 2 + i * frame.stride;
  return [frame.bytes[o], frame.bytes[o + 1], frame.bytes[o + 2]];
}

// Mirror a device's /json/state onto the runs, pairing them with segments by
// order. Effect ids and color formatting come from the caller, so this stays
// independent of the app's effect tables.
function applyDeviceState(state, runs, helpers) {
  const segs = Array.isArray(state.seg) ? state.seg : [];
  const count = Math.min(segs.length, runs.length);
  const on = typeof state.on === 'boolean' ? state.on : true;

  for (let i = 0; i < count; i++) {
    const seg = segs[i], run = runs[i];
    if (!seg || !run) continue;
    if (typeof seg.fx === 'number') {
      const resolved = helpers.effectValue(seg.fx);
      run.effect = resolved.effect;
      run.effectLabel = resolved.effectLabel;
      run.simKey = resolved.simKey;
    }
    if (typeof seg.pal === 'number') run.paletteId = seg.pal;
    if (typeof seg.sx === 'number') run.speed = seg.sx;
    if (typeof seg.ix === 'number') run.intensity = seg.ix;
    if (Array.isArray(seg.col)) {
      if (seg.col[0]) run.color1 = helpers.rgbToHex(seg.col[0]);
      if (seg.col[1]) run.color2 = helpers.rgbToHex(seg.col[1]);
      if (seg.col[2]) run.color3 = helpers.rgbToHex(seg.col[2]);
    }
    if (typeof seg.grp === 'number') run.grouping = Math.max(1, seg.grp);
    if (typeof seg.spc === 'number') run.spacing = Math.max(0, seg.spc);
    if (typeof seg.mi === 'boolean') run.mirror = seg.mi;
    if (typeof seg.rev === 'boolean') run.reverse = seg.rev;
    if (typeof seg.bri === 'number') run.opacity = seg.bri / 255;
    run.visible = on && seg.on !== false;
  }

  return {
    segCount: segs.length,
    mirroredCount: count,
    on,
    brightness: state.bri,
  };
}

// Where a newly drawn run sits on the strip. A connected device knows its own
// geometry, so a new run lines up with what it is actually driving instead of
// an arbitrary default that matches no hardware.
function newRunGeometry(opts) {
  const segments = opts.segments || [];
  const seg = segments[opts.runIndex];
  if (seg) return { startIndex: seg.start, ledCount: seg.len };
  const remaining = (opts.stripLen || 0) - opts.previousEnd;
  return {
    startIndex: opts.previousEnd,
    ledCount: remaining > 0 ? remaining : 30,
  };
}

// Build the runs a project is missing, one per device segment it has no run
// for. Additive on purpose: existing runs carry paths the user drew, which the
// controller knows nothing about and importing must not discard.
function importRuns(state, runs, deps) {
  const segs = Array.isArray(state.seg) ? state.seg : [];
  let imported = 0;
  for (let i = runs.length; i < segs.length; i++) {
    const run = deps.createRun();
    run.startIndex = segs[i].start;
    run.ledCount = segs[i].len;
    runs.push(run);
    imported++;
  }
  // Effect, palette, colors and segment options come from the same mapping
  // Live Mirror uses, so an imported run looks like what the device is showing.
  applyDeviceState(state, runs, deps.helpers);
  return { imported };
}

// What the runs collectively claim of the strip: each run's LED range, plus
// any ranges claimed twice (overlaps) or not at all between runs (gaps).
// Derived on demand and never written back — startIndex chaining is only a
// guess made at add time, and reorder/delete/resize silently invalidate it,
// so the truth has to be recomputed, reported, and left for the user to fix.
function stripLayout(runs) {
  const overlaps = [];
  const gaps = [];
  const ranges = runs.map((r, i) => ({ run: i, start: r.startIndex, end: r.startIndex + r.ledCount }));
  const sorted = ranges.slice().sort((a, b) => a.start - b.start || a.end - b.end);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1], cur = sorted[i];
    if (cur.start < prev.end) {
      overlaps.push({
        runs: [prev.run, cur.run].sort((a, b) => a - b),
        start: cur.start,
        count: Math.min(prev.end, cur.end) - cur.start,
      });
    } else if (cur.start > prev.end) {
      gaps.push({ start: prev.end, count: cur.start - prev.end });
    }
  }
  return { overlaps, gaps };
}

// How a run's geometry differs from the segment it mirrors, or null when they
// agree. Deliberately reported rather than applied: ledCount is layout the
// user drew and it feeds the exported segment bounds, so adopting it is their
// call, unlike effect or palette which re-sync harmlessly every frame.
function geometryMismatch(run, seg) {
  if (!seg) return null;
  if (run.startIndex === seg.start && run.ledCount === seg.len) return null;
  return { startIndex: seg.start, ledCount: seg.len };
}

// The badge is how you tell real device pixels from a local approximation, so
// the two states read differently rather than both just saying "LIVE".
function renderLiveBadge(el, status) {
  if (!el) return;
  if (!status.mirroring) {
    el.style.display = 'none';
    el.textContent = '● LIVE';
    return;
  }
  el.style.display = 'inline';
  el.textContent = status.pixelExact ? '● LIVE · PIXEL' : '● LIVE';
  el.title = status.pixelExact
    ? `Pixel-exact: painting ${status.pixelCount} LED colors straight from the device, `
      + `${status.mirroredCount} of ${status.segCount || 0} segment(s) onto ${status.runCount} run(s).`
    : `Mirroring ${status.mirroredCount} of ${status.segCount || 0} device segment(s) onto `
      + `${status.runCount} run(s). Effects are simulated locally — no live LED feed from this device.`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    liveFrameColor,
    parseLiveFrame,
    isFrameFresh,
    applyDeviceState,
    renderLiveBadge,
    newRunGeometry,
    geometryMismatch,
    stripLayout,
    importRuns,
    LIVE_PIXEL_STALE_MS,
  };
}
