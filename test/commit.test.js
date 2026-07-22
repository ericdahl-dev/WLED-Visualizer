// @vitest-environment happy-dom

import { test } from 'vitest';
import assert from 'node:assert';

import { createCommit } from '../html/ui.js';

function harness({ tab = 'settings' } = {}) {
  const calls = [];
  const body = document.createElement('div');
  document.body.appendChild(body);
  const commit = createCommit({
    renderRunsList: () => calls.push('list'),
    renderInspector: () => calls.push('inspector'),
    updateLiveBadge: () => calls.push('badge'),
    getInspectorTab: () => tab,
    getInspectorBody: () => body,
  });
  return { commit, calls, body };
}

function focusField(body, type) {
  const el = document.createElement(type === 'select' ? 'select' : 'input');
  if (type !== 'select') el.type = type;
  body.appendChild(el);
  el.focus();
  return el;
}

// The bug class this seam exists to kill: three shipped/live instances of a
// mutation redrawing one part of the UI and not another.
test('a committed mutation redraws the list, the inspector and the badge', () => {
  const { commit, calls } = harness();
  const run = { visible: true };

  commit(() => { run.visible = !run.visible; });

  assert.strictEqual(run.visible, false, 'mutation not applied');
  assert.deepStrictEqual(calls, ['list', 'inspector', 'badge']);
});

// Rebuilding the inspector mid-edit destroys what the user is doing: partial
// text, a colour picker mid-drag, a slider mid-throw. Those fields hold state.
test('keeps the inspector intact while a stateful field is being edited', () => {
  for (const type of ['text', 'number', 'color', 'range']) {
    const { commit, calls, body } = harness();
    focusField(body, type);

    commit(() => {});

    assert.ok(!calls.includes('inspector'), `${type}: inspector rebuilt mid-edit`);
    assert.ok(calls.includes('list') && calls.includes('badge'), `${type}: other renders skipped`);
  }
});

// Selects, checkboxes and buttons are atomic — after their change fires there
// is nothing in-progress to destroy, and effect changes NEED the rebuild to
// swap which parameter fields show.
test('atomic controls do not suppress the inspector rebuild', () => {
  for (const type of ['select', 'checkbox']) {
    const { commit, calls, body } = harness();
    focusField(body, type);

    commit(() => {});

    assert.ok(calls.includes('inspector'), `${type}: rebuild wrongly suppressed`);
  }
});

// The device tab hosts an iframe of the controller's own UI; rebuilding it on
// every mutation would reload the iframe.
test('does not rebuild the inspector while the device tab is showing', () => {
  const { commit, calls } = harness({ tab: 'device' });

  commit(() => {});

  assert.ok(!calls.includes('inspector'));
  assert.ok(calls.includes('list') && calls.includes('badge'));
});

// Fields outside the inspector (the controller IP box, say) get no protection.
test('editing a field outside the inspector does not suppress anything', () => {
  const { commit, calls } = harness();
  const outside = document.createElement('input');
  outside.type = 'text';
  document.body.appendChild(outside);
  outside.focus();

  commit(() => {});

  assert.deepStrictEqual(calls, ['list', 'inspector', 'badge']);
});

// Background commits are device-initiated — they arrive every second while
// polling. A foreground select change already happened when commit runs, but a
// background push mid-browse would close the dropdown under the user's cursor,
// so background protects ANY focus inside the inspector.
test('background commits protect any focused control in the inspector', () => {
  const { commit, calls, body } = harness();
  focusField(body, 'select');

  commit(() => {}, { background: true });

  assert.ok(!calls.includes('inspector'), 'background push rebuilt under an open select');
  assert.ok(calls.includes('list') && calls.includes('badge'));
});

test('background commits still rebuild when focus is elsewhere', () => {
  const { commit, calls } = harness();

  commit(() => {}, { background: true });

  assert.ok(calls.includes('inspector'));
});
