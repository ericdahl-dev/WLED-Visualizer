/* The controller client: everything about talking to a WLED device lives
   behind this seam — URL building, error normalization, segment mapping and
   the live-view feed. The UI holds DOM and state; multiple-controller support
   later becomes "hold several of these" instead of a rewrite. Transport is
   injectable so the decision logic is testable without a device. */

// The one place a device state's segments become the app's {start, len} form.
function deviceSegmentsOf(state) {
  return (state && Array.isArray(state.seg))
    ? state.seg.map((s) => ({ start: s.start, len: s.len }))
    : [];
}

function createController(opts) {
  const fetchImpl = (opts && opts.fetch) || ((...a) => fetch(...a));
  const WS = (opts && opts.WebSocket) || (typeof WebSocket !== 'undefined' ? WebSocket : null);
  const setIntervalImpl = (opts && opts.setInterval) || ((...a) => setInterval(...a));
  const clearIntervalImpl = (opts && opts.clearInterval) || ((...a) => clearInterval(...a));

  let ip = null;
  let socket = null;
  let pollTimer = null;

  async function getJson(path) {
    const res = await fetchImpl('http://' + ip + path);
    if (!res.ok) throw new Error('bad response for ' + path);
    return res.json();
  }

  // Effects and palettes make a connection usable; info and state enrich it.
  // Their failure degrades the result rather than aborting the connect.
  async function connect(newIp) {
    ip = newIp;
    const [effects, palettes] = await Promise.all([getJson('/json/eff'), getJson('/json/pal')]);
    let info = null, segments = [];
    try { info = await getJson('/json/info'); } catch (e) {}
    try { segments = deviceSegmentsOf(await getJson('/json/state')); } catch (e) {}
    return { effects, palettes, info, segments };
  }

  async function getState() {
    return getJson('/json/state');
  }

  /* The live feed. Prefer the websocket (push, and the only source of pixel
     frames); fall back to polling state when the socket can't be had, so
     older firmware still mirrors. onLost fires when even polling fails. */

  let feedCallbacks = null;

  function stopPolling() {
    if (pollTimer) { clearIntervalImpl(pollTimer); pollTimer = null; }
  }

  async function pollOnce() {
    if (!feedCallbacks) return;
    try {
      const state = await getState();
      if (feedCallbacks && feedCallbacks.onState) feedCallbacks.onState(state);
    } catch (e) {
      const cbs = feedCallbacks;
      closeLiveFeed();
      if (cbs && cbs.onLost) cbs.onLost();
    }
  }

  function startPolling(pollMs) {
    stopPolling();
    pollOnce();
    pollTimer = setIntervalImpl(pollOnce, pollMs || 1000);
  }

  function openLiveFeed(callbacks) {
    feedCallbacks = callbacks || {};
    const cbs = feedCallbacks;
    try {
      socket = new WS('ws://' + ip + '/ws');
    } catch (e) {
      socket = null;
      startPolling(cbs.pollMs);
      return;
    }
    socket.binaryType = 'arraybuffer';
    socket.onopen = () => {
      // Ask for the live LED stream; devices without it just never send
      // binary frames. Push one state read so mirroring starts immediately.
      try { socket.send(JSON.stringify({ lv: true })); } catch (e) {}
      getState().then((s) => { if (feedCallbacks && cbs.onState) cbs.onState(s); }).catch(() => {});
    };
    socket.onmessage = (ev) => {
      if (!feedCallbacks) return;
      if (ev.data instanceof ArrayBuffer) {
        if (cbs.onFrame) cbs.onFrame(ev.data);
        return;
      }
      let data;
      try { data = JSON.parse(ev.data); } catch (e) { return; }
      const state = (data && data.state) ? data.state : data;
      if (state && (Array.isArray(state.seg) || typeof state.bri === 'number')) {
        if (cbs.onState) cbs.onState(state);
      }
    };
    socket.onclose = () => {
      socket = null;
      if (feedCallbacks && !pollTimer) startPolling(cbs.pollMs);
    };
    socket.onerror = () => { if (socket) socket.close(); };
  }

  function closeLiveFeed() {
    feedCallbacks = null;
    if (socket) {
      try { if (socket.readyState === 1) socket.send(JSON.stringify({ lv: false })); } catch (e) {}
      socket.onclose = null;
      socket.close();
      socket = null;
    }
    stopPolling();
  }

  return { connect, getState, openLiveFeed, closeLiveFeed };
}

// Bring a loaded project up to the multi-controller model. Legacy projects
// (no controllers key) get one synthesized controller owning every run; the
// discriminator is the key's presence, not a version field. Zero-loss.
function migrateProjectControllers(data, makeId) {
  let controllers = Array.isArray(data.controllers) && data.controllers.length
    ? data.controllers.map((c) => ({ id: c.id, name: c.name, ip: c.ip || '' }))
    : [{
        id: makeId(),
        name: 'Controller 1',
        ip: (data.meta && data.meta.connectedController) || '',
      }];
  const fallback = controllers[0].id;
  const runs = (data.runs || []).map((r) => (
    r.controllerId && controllers.some((c) => c.id === r.controllerId)
      ? r
      : Object.assign({}, r, { controllerId: fallback })
  ));
  return { controllers, runs };
}

// Where the next run on a controller's strip starts: after the last LED any
// of that controller's runs claim. Each controller is its own address space.
function previousEndFor(runs, controllerId) {
  return runs
    .filter((r) => r.controllerId === controllerId)
    .reduce((end, r) => Math.max(end, r.startIndex + r.ledCount), 0);
}

// Deleting a controller is blocked while it owns runs (maintainer decision on
// the multi-controller design) and the last controller can never be removed.
function canDeleteController(runs, controllerId, controllerCount) {
  if (controllerCount <= 1) return { ok: false, reason: 'the last controller cannot be deleted' };
  const owned = runs.filter((r) => r.controllerId === controllerId).length;
  if (owned) return { ok: false, reason: 'delete or reassign its ' + owned + ' run(s) first' };
  return { ok: true, reason: '' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createController, deviceSegmentsOf, migrateProjectControllers, previousEndFor, canDeleteController };
}
