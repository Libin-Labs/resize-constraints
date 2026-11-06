import test from 'node:test';
import assert from 'node:assert/strict';
import { resize } from '../dist/esm/index.js';

const rect = { x: 10, y: 20, width: 100, height: 50 };
test('corner movement preserves opposite point exactly', () => {
  assert.deepEqual(resize(rect, 'nw', { x: 20, y: 10 }), {
    ok: true,
    rect: { x: 30, y: 30, width: 80, height: 40 },
    clamped: false,
  });
  assert.deepEqual(resize(rect, 'se', { x: 10, y: 5 }).rect, {
    x: 10,
    y: 20,
    width: 110,
    height: 55,
  });
});
test('min max clamp crossing without flipping the opposite point', () => {
  const r = resize(rect, 'nw', { x: 200, y: -200 }, { minWidth: 20, maxHeight: 80 });
  assert.deepEqual(r, { ok: true, rect: { x: 90, y: -10, width: 20, height: 80 }, clamped: true });
  assert.equal(r.rect.x + r.rect.width, 110);
  assert.equal(r.rect.y + r.rect.height, 70);
});
test('aspect edge resizes around opposite edge midpoint', () => {
  assert.deepEqual(resize(rect, 'e', { x: 20, y: 900 }, { aspectRatio: 2 }), {
    ok: true,
    rect: { x: 10, y: 15, width: 120, height: 60 },
    clamped: true,
  });
  assert.deepEqual(resize(rect, 'n', { x: 900, y: -10 }, { aspectRatio: 2 }).rect, {
    x: 0,
    y: 10,
    width: 120,
    height: 60,
  });
});
test('aspect corner projection and combined dimension clamps are exact', () => {
  const projected = resize(rect, 'se', { x: 0, y: 10 }, { aspectRatio: 2 });
  assert.deepEqual(projected.rect, { x: 10, y: 20, width: 104, height: 52 });
  const constrained = resize(
    rect,
    'se',
    { x: 100, y: 100 },
    { aspectRatio: 2, maxHeight: 60, minWidth: 110 },
  );
  assert.deepEqual(constrained.rect, { x: 10, y: 20, width: 120, height: 60 });
});
test('impossible width height aspect ranges return explicit diagnostics', () => {
  assert.deepEqual(resize(rect, 'e', { x: 0, y: 0 }, { minWidth: 10, maxWidth: 5 }), {
    ok: false,
    reason: 'width-range',
  });
  assert.deepEqual(resize(rect, 'e', { x: 0, y: 0 }, { minHeight: 10, maxHeight: 5 }), {
    ok: false,
    reason: 'height-range',
  });
  assert.deepEqual(
    resize(rect, 'e', { x: 0, y: 0 }, { minWidth: 100, maxHeight: 10, aspectRatio: 2 }),
    { ok: false, reason: 'aspect-range' },
  );
});
test('nonfinite and negative input rejects while arithmetic overflow diagnoses', () => {
  assert.throws(() => resize(rect, 'bad', { x: 0, y: 0 }), TypeError);
  assert.throws(() => resize(rect, 'e', { x: NaN, y: 0 }), TypeError);
  assert.throws(() => resize(rect, 'e', { x: 0, y: 0 }, { aspectRatio: 0 }), TypeError);
  assert.throws(() => resize(rect, 'e', { x: 0, y: 0 }, { minWidth: -1 }), TypeError);
  assert.deepEqual(
    resize({ x: 0, y: 0, width: Number.MAX_VALUE, height: 1 }, 'e', { x: Number.MAX_VALUE, y: 0 }),
    { ok: false, reason: 'overflow' },
  );
});
test('all anchors preserve opposite point without mutating caller geometry', () => {
  for (const handle of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
    const r = resize(rect, handle, { x: 10, y: 5 });
    assert.equal(r.ok, true);
    if (handle.includes('w')) assert.equal(r.rect.x + r.rect.width, 110);
    if (handle.includes('n')) assert.equal(r.rect.y + r.rect.height, 70);
    if (handle.includes('e')) assert.equal(r.rect.x, 10);
    if (handle.includes('s')) assert.equal(r.rect.y, 20);
  }
  assert.deepEqual(rect, { x: 10, y: 20, width: 100, height: 50 });
});
test('subunit aspect ratios project correctly and honor fixed anchor', () => {
  const r = resize(
    { x: 0, y: 0, width: 50, height: 100 },
    'se',
    { x: 10, y: 0 },
    { aspectRatio: 0.5 },
  );
  assert.deepEqual(r.rect, { x: 0, y: 0, width: 52, height: 104 });
});

test('unrepresentable aspect intersections cannot report an invalid successful shape', () => {
  assert.deepEqual(
    resize(
      rect,
      'se',
      { x: 0, y: 0 },
      {
        aspectRatio: Number.MIN_VALUE,
        minHeight: 0.1,
        maxWidth: 0,
      },
    ),
    { ok: false, reason: 'aspect-range' },
  );
  assert.deepEqual(
    resize(
      { x: 0, y: 0, width: Number.MIN_VALUE, height: 0 },
      'e',
      { x: 0, y: 0 },
      { aspectRatio: Number.MAX_VALUE, minWidth: Number.MIN_VALUE },
    ),
    { ok: false, reason: 'aspect-range' },
  );
});

test('deterministic constraint sweep never returns dimensions outside the feasible intersection', () => {
  let seed = 13;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  for (let i = 0; i < 500; i++) {
    const constraints = {
      minWidth: random() * 20,
      maxWidth: 40 + random() * 100,
      minHeight: random() * 20,
      maxHeight: 40 + random() * 100,
      aspectRatio: 0.25 + random() * 4,
    };
    const result = resize(
      rect,
      handles[i % handles.length],
      { x: random() * 400 - 200, y: random() * 400 - 200 },
      constraints,
    );
    if (!result.ok) {
      assert.equal(result.reason, 'aspect-range');
      continue;
    }
    assert.ok(
      result.rect.width >= constraints.minWidth && result.rect.width <= constraints.maxWidth,
    );
    assert.ok(
      result.rect.height >= constraints.minHeight && result.rect.height <= constraints.maxHeight,
    );
    assert.ok(Math.abs(result.rect.width - result.rect.height * constraints.aspectRatio) < 1e-10);
  }
});
