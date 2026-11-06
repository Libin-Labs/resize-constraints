import { resize } from '@lp-labs/resize-constraints';

const result = resize(
  { x: 10, y: 20, width: 100, height: 50 },
  'nw',
  { x: 200, y: -200 },
  { minWidth: 20, maxHeight: 80 },
);
if (!result.ok || result.rect.x !== 90 || result.rect.y !== -10) {
  throw new Error('Constrained anchor failed');
}

// @ts-expect-error invalid public API input must be rejected
resize({ x: 0, y: 0, width: 1, height: 1 }, 'center', { x: 0, y: 0 });
