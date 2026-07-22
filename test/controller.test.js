import { test } from 'vitest';
import assert from 'node:assert';

import { createController } from '../html/controller.js';

const DEVICE = {
  '/json/eff': ['Solid', 'Blink'],
  '/json/pal': ['Default'],
  '/json/info': { name: 'WLED-Test', leds: { count: 50 } },
  '/json/state': { on: true, bri: 128, seg: [{ start: 0, stop: 50, len: 50, fx: 1 }] },
};

function fakeFetch(routes = DEVICE, fail = []) {
  const calls = [];
  const impl = async (url) => {
    calls.push(url);
    const path = url.replace(/^http:\/\/[^/]+/, '');
    if (fail.includes(path)) return { ok: false };
    if (!(path in routes)) return { ok: false };
    return { ok: true, json: async () => routes[path] };
  };
  return { impl, calls };
}

// Connect gathers everything the app needs in one call — callers stop
// composing four fetches and mapping segments themselves.
test('connect resolves the device description in one call', async () => {
  const { impl, calls } = fakeFetch();
  const ctl = createController({ fetch: impl });

  const dev = await ctl.connect('10.0.0.5');

  assert.deepStrictEqual(dev.effects, ['Solid', 'Blink']);
  assert.deepStrictEqual(dev.palettes, ['Default']);
  assert.strictEqual(dev.info.name, 'WLED-Test');
  assert.deepStrictEqual(dev.segments, [{ start: 0, len: 50 }]);
  assert.ok(calls.every((u) => u.startsWith('http://10.0.0.5/')), 'URL building leaked');
});

// Effects and palettes are what make a connection usable; info and state are
// enrichment. Their failure degrades, it doesn't abort.
test('connect fails without effects, degrades without info or state', async () => {
  const bad = createController({ fetch: fakeFetch(DEVICE, ['/json/eff']).impl });
  await assert.rejects(() => bad.connect('10.0.0.5'));

  const degraded = createController({ fetch: fakeFetch(DEVICE, ['/json/info', '/json/state']).impl });
  const dev = await degraded.connect('10.0.0.5');
  assert.strictEqual(dev.info, null);
  assert.deepStrictEqual(dev.segments, []);
});

function fakeWS() {
  const instances = [];
  function FakeWebSocket(url) {
    this.url = url;
    this.sent = [];
    this.readyState = 1;
    this.send = (m) => this.sent.push(m);
    this.close = () => { this.readyState = 3; if (this.onclose) this.onclose(); };
    instances.push(this);
  }
  return { FakeWebSocket, instances };
}

function manualTimers() {
  const timers = [];
  return {
    setInterval: (fn, ms) => { timers.push(fn); return timers.length; },
    clearInterval: (id) => { timers[id - 1] = null; },
    tick: () => timers.filter(Boolean).forEach((fn) => fn()),
    active: () => timers.filter(Boolean).length,
  };
}

// The live feed asks the device to stream ({"lv":true}) and hands frames and
// state updates back; the caller never touches the socket.
test('the live feed opens the socket, asks for the stream, and routes messages', async () => {
  const { impl } = fakeFetch();
  const { FakeWebSocket, instances } = fakeWS();
  const ctl = createController({ fetch: impl, WebSocket: FakeWebSocket });
  await ctl.connect('10.0.0.5');

  const frames = [], states = [];
  ctl.openLiveFeed({ onFrame: (b) => frames.push(b), onState: (s) => states.push(s) });
  const ws = instances[0];
  ws.onopen();
  await new Promise((r) => setTimeout(r, 0));

  assert.ok(ws.url.endsWith('/ws'), 'wrong socket url');
  assert.deepStrictEqual(ws.sent, ['{"lv":true}']);
  assert.strictEqual(states.length, 1, 'no initial state push');

  const buf = new ArrayBuffer(8);
  ws.onmessage({ data: buf });
  ws.onmessage({ data: JSON.stringify({ state: { on: true, bri: 9, seg: [] } }) });

  assert.deepStrictEqual(frames, [buf]);
  assert.strictEqual(states[1].bri, 9);
});

// Older firmware has no live view: the socket dies and the feed keeps working
// by polling state instead, and reports when even that is gone.
test('falls back to polling when the socket closes, reports a lost device', async () => {
  const routes = { ...DEVICE };
  const { impl } = fakeFetch(routes);
  const { FakeWebSocket, instances } = fakeWS();
  const t = manualTimers();
  const ctl = createController({ fetch: impl, WebSocket: FakeWebSocket, setInterval: t.setInterval, clearInterval: t.clearInterval });
  await ctl.connect('10.0.0.5');

  const states = []; let lost = 0;
  ctl.openLiveFeed({ onState: (s) => states.push(s), onLost: () => lost++ });
  instances[0].close();
  await new Promise((r) => setTimeout(r, 0));
  assert.ok(t.active() > 0, 'no polling started');

  t.tick();
  await new Promise((r) => setTimeout(r, 0));
  assert.ok(states.length >= 1, 'polling produced no state');

  delete routes['/json/state'];
  t.tick();
  await new Promise((r) => setTimeout(r, 0));
  assert.strictEqual(lost, 1, 'device loss not reported');
});

// Stopping tells the device to stop streaming and kills socket and polling.
test('closing the feed sends the stop handshake and stops everything', async () => {
  const { impl } = fakeFetch();
  const { FakeWebSocket, instances } = fakeWS();
  const t = manualTimers();
  const ctl = createController({ fetch: impl, WebSocket: FakeWebSocket, setInterval: t.setInterval, clearInterval: t.clearInterval });
  await ctl.connect('10.0.0.5');
  ctl.openLiveFeed({});
  const ws = instances[0];
  ws.onopen();

  ctl.closeLiveFeed();

  assert.ok(ws.sent.includes('{"lv":false}'), 'no stop handshake');
  assert.strictEqual(ws.readyState, 3, 'socket left open');
  assert.strictEqual(t.active(), 0, 'polling left running');
});

import { migrateProjectControllers } from '../html/controller.js';

// Projects saved before multi-controller support have no controllers key.
// Import synthesizes one and stamps every run — zero loss, no version field;
// the presence of controllers/controllerId is the discriminator.
test('a legacy project gets one synthesized controller owning every run', () => {
  const data = {
    meta: { connectedController: '192.168.2.27' },
    runs: [{ name: 'Porch' }, { name: 'Roof' }],
  };

  const out = migrateProjectControllers(data, () => 'ctrl_1');

  assert.deepStrictEqual(out.controllers, [{ id: 'ctrl_1', name: 'Controller 1', ip: '192.168.2.27' }]);
  assert.ok(out.runs.every((r) => r.controllerId === 'ctrl_1'));
});

test('a legacy project with no recorded ip synthesizes an empty one', () => {
  const out = migrateProjectControllers({ runs: [{}] }, () => 'c');

  assert.strictEqual(out.controllers[0].ip, '');
});

// Modern projects pass through; stray runs without an owner are stamped with
// the first controller rather than left dangling.
test('a modern project is preserved, unowned runs adopted by the first controller', () => {
  const data = {
    controllers: [{ id: 'a', name: 'Roofline', ip: '10.0.0.1' }, { id: 'b', name: 'Porch', ip: '10.0.0.2' }],
    runs: [{ controllerId: 'b' }, {}],
  };

  const out = migrateProjectControllers(data, () => 'never');

  assert.strictEqual(out.controllers.length, 2);
  assert.strictEqual(out.controllers[0].name, 'Roofline');
  assert.strictEqual(out.runs[0].controllerId, 'b');
  assert.strictEqual(out.runs[1].controllerId, 'a');
});

import { previousEndFor, canDeleteController } from '../html/controller.js';

// Start-index chaining scopes to the owning controller: each controller's
// strip is its own address space, so a new run continues ITS controller's
// chain, not whichever run happened to be added last globally.
test('a new run chains from the last run of the same controller only', () => {
  const runs = [
    { controllerId: 'a', startIndex: 0, ledCount: 50 },
    { controllerId: 'b', startIndex: 0, ledCount: 30 },
    { controllerId: 'a', startIndex: 50, ledCount: 10 },
  ];

  assert.strictEqual(previousEndFor(runs, 'a'), 60);
  assert.strictEqual(previousEndFor(runs, 'b'), 30);
  assert.strictEqual(previousEndFor(runs, 'new'), 0);
});

// Maintainer decision on #6: deleting a controller is blocked while it still
// owns runs — no destructive surprise, no ambiguous orphans.
test('a controller cannot be deleted while it owns runs, nor the last one', () => {
  const runs = [{ controllerId: 'a' }];

  assert.strictEqual(canDeleteController(runs, 'a', 2).ok, false);
  assert.match(canDeleteController(runs, 'a', 2).reason, /run/);
  assert.strictEqual(canDeleteController(runs, 'b', 2).ok, true);
  assert.strictEqual(canDeleteController([], 'a', 1).ok, false, 'deleted the only controller');
});
