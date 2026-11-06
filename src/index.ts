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
  | { ok: true; rect: Rect; clamped: boolean }
  | { ok: false; reason: 'width-range' | 'height-range' | 'aspect-range' | 'overflow' };
/** Keeps the opposite corner fixed, or the opposite edge midpoint for an edge handle. */
export function resize(
  rect: Rect,
  handle: ResizeHandle,
  delta: { x: number; y: number },
  constraints: ResizeConstraints = {},
): ResizeResult {
  if (
    ![rect.x, rect.y, rect.width, rect.height, delta.x, delta.y].every(Number.isFinite) ||
    rect.width < 0 ||
    rect.height < 0 ||
    !['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].includes(handle)
  )
    throw new TypeError('Invalid resize input');
  const minW = constraints.minWidth ?? 0,
    maxW = constraints.maxWidth ?? Number.MAX_VALUE;
  const minH = constraints.minHeight ?? 0,
    maxH = constraints.maxHeight ?? Number.MAX_VALUE;
  const ratio = constraints.aspectRatio;
  if (
    ![minW, maxW, minH, maxH].every((n) => Number.isFinite(n) && n >= 0) ||
    (ratio !== undefined && (!Number.isFinite(ratio) || ratio <= 0))
  )
    throw new TypeError('Invalid constraints');
  if (minW > maxW) return { ok: false, reason: 'width-range' };
  if (minH > maxH) return { ok: false, reason: 'height-range' };
  const sx = handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0;
  const sy = handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0;
  let width = sx ? rect.width + delta.x * sx : rect.width;
  let height = sy ? rect.height + delta.y * sy : rect.height;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return { ok: false, reason: 'overflow' };
  const wantedW = width,
    wantedH = height;
  if (ratio !== undefined) {
    const lower = Math.max(minW, minH * ratio);
    const upper = Math.min(maxW, maxH * ratio);
    if (lower > upper || !Number.isFinite(lower)) return { ok: false, reason: 'aspect-range' };
    // A normalized projection avoids squaring extreme aspect ratios.
    const projected =
      sx && sy
        ? ratio >= 1
          ? (width + height / ratio) / (1 + 1 / ratio / ratio)
          : (width * ratio + height) / (ratio + 1 / ratio)
        : sx
          ? width
          : height * ratio;
    width = Math.min(upper, Math.max(lower, projected));
    height = width / ratio;
  } else {
    width = Math.min(maxW, Math.max(minW, width));
    height = Math.min(maxH, Math.max(minH, height));
  }
  const x =
    sx === -1 ? rect.x + rect.width - width : sx === 0 ? rect.x + (rect.width - width) / 2 : rect.x;
  const y =
    sy === -1
      ? rect.y + rect.height - height
      : sy === 0
        ? rect.y + (rect.height - height) / 2
        : rect.y;
  if (![x, y, width, height, x + width, y + height].every(Number.isFinite))
    return { ok: false, reason: 'overflow' };
  if (
    width < minW ||
    width > maxW ||
    height < minH ||
    height > maxH ||
    (ratio !== undefined && (width === 0) !== (height === 0))
  ) {
    return { ok: false, reason: 'aspect-range' };
  }
  return {
    ok: true,
    rect: { x, y, width, height },
    clamped: width !== wantedW || height !== wantedH,
  };
}
