# @lp-labs/resize-constraints

Anchor-preserving rectangle resize with min/max, aspect projection and explicit infeasibility diagnostics.

Standalone original implementation with zero runtime, peer or sibling dependencies.
Library ID 443. ES2022, strict TypeScript, NodeNext ESM and CommonJS with declarations.

## Install

```bash
npm install @lp-labs/resize-constraints
```

CommonJS: `const { resize } = require('@lp-labs/resize-constraints')`.

## Quickstart

```js
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
```

## API, customization and contracts

`resize(rect, handle, delta, constraints?)` computes a detached result; inputs are not mutated.
Handles: n, s, e, w, ne, nw, se, sw. Delta is pointer displacement from the supplied original
rectangle, not a previous resize result. Width/height are finite nonnegative; all coordinates
and deltas finite. The opposite corner remains fixed for corner handles; edge handles keep
the opposite edge midpoint fixed, centering changes on the unused dimension.

minWidth/minHeight default zero, maxWidth/maxHeight default Number.MAX_VALUE. Constraints
must be finite nonnegative. Without aspectRatio, dimensions clamp independently and never
flip through the opposite point. Optional positive finite aspectRatio means width/height.
An edge drives its matching dimension; corner movement projects the desired dimensions
onto the aspect line using least-squares distance. The feasible width interval intersects
[minWidth,maxWidth] with aspect-scaled height bounds, then clamps the projection.
Aspect corrections may resize the initially unused edge dimension. A precision-limited
projection that would violate the intersection is reported as aspect-range, never success.

Success: { ok:true, rect, clamped }, where clamped means either output dimension differs
from the raw handle proposal, including aspect projection. Infeasible finite constraints
return { ok:false, reason } with 'width-range', 'height-range' or 'aspect-range'.
Arithmetic producing nonfinite geometry returns 'overflow'; no partial shape is returned.
Invalid shapes/handles/nonfinite inputs or malformed constraints throw TypeError.
Every successful result satisfies the constraint intersection subject to JavaScript
floating-point precision. Very extreme aspect ratios may be infeasible at representable precision.
Time and memory O(1). No rotated coordinates, container bounds, minimum area or DOM side effects.

## Complete public declarations

```ts
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export interface ResizeConstraints {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
}
export type ResizeResult =
  | {
      ok: true;
      rect: Rect;
      clamped: boolean;
    }
  | {
      ok: false;
      reason: 'width-range' | 'height-range' | 'aspect-range' | 'overflow';
    };
/** Keeps the opposite corner fixed, or the opposite edge midpoint for an edge handle. */
export declare function resize(
  rect: Rect,
  handle: ResizeHandle,
  delta: {
    x: number;
    y: number;
  },
  constraints?: ResizeConstraints,
): ResizeResult;
```

## Scope and performance

Pure rectangle geometry; no handles UI, DOM measuring, rotation, pointer backend or silent impossible-shape coercion.

Complexities and bounds above assume ordinary JavaScript number arithmetic and Map/Set
average constant-time lookup. No runtime or peer dependencies, automatic browser adapters,
global registries or hidden services are included. Importing the module has no browser effects.

## Development

```bash
npm ci --offline --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
