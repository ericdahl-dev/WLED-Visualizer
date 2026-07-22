import { test } from 'vitest';
import assert from 'node:assert';

import { parseEffectValue, formatEffectValue, resolveEffectRef } from '../html/effects.js';

// One codec owns the 'wled_N' / 'live_N' string convention. Everything else
// holds the structured form.
test('parses and formats the three effect value kinds round-trip', () => {
  for (const val of ['wled_28', 'live_144', 'chase']) {
    assert.strictEqual(formatEffectValue(parseEffectValue(val)), val);
  }
  assert.deepStrictEqual(parseEffectValue('wled_28'), { kind: 'wled', id: 28 });
  assert.deepStrictEqual(parseEffectValue('live_144'), { kind: 'live', id: 144 });
  assert.deepStrictEqual(parseEffectValue('chase'), { kind: 'sim', key: 'chase' });
});

test('resolves a built-in wled effect to its label, sim and id', () => {
  const r = resolveEffectRef(parseEffectValue('wled_28'), {});

  assert.strictEqual(r.label, 'Chase');
  assert.strictEqual(r.simKey, 'chase');
  assert.strictEqual(r.wledId, 28);
});

// /json/eff array index IS the effect id — WLED keeps gaps aligned with RSVD
// entries. Verified against a physical 16.0.1 device (index 26 = Blink
// Rainbow = state fx 26). So a live ref's wledId is its index, by contract.
test('resolves a live effect through the device list, id preserved by API contract', () => {
  const ctx = { liveNames: ['Solid', 'Custom Wobble'], guessSim: () => 'noise' };

  const r = resolveEffectRef(parseEffectValue('live_1'), ctx);

  assert.strictEqual(r.label, 'Custom Wobble');
  assert.strictEqual(r.simKey, 'noise');
  assert.strictEqual(r.wledId, 1);
});

test('unknown ids degrade to the value string, chase sim, and the id it claims', () => {
  const r = resolveEffectRef(parseEffectValue('wled_9999'), {});

  assert.strictEqual(r.label, 'wled_9999');
  assert.strictEqual(r.simKey, 'chase');
  assert.strictEqual(r.wledId, 9999);
});

test('a plain sim key resolves to itself with no wled id', () => {
  const r = resolveEffectRef(parseEffectValue('rainbow'), {});

  assert.strictEqual(r.simKey, 'rainbow');
  assert.strictEqual(r.wledId, null);
});
