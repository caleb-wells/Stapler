export const SOURCE_DPI = 96;
const POINTS_PER_INCH = 72;

export interface PageSize {
  width: number;
  height: number;
}

export function pageSizeFor(widthPx: number, heightPx: number): PageSize {
  if (!(widthPx > 0) || !(heightPx > 0)) {
    throw new Error(`Image dimensions must be positive, got ${widthPx}x${heightPx}`);
  }
  const scale = POINTS_PER_INCH / SOURCE_DPI;
  return { width: widthPx * scale, height: heightPx * scale };
}
