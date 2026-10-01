import { describe, expect, it } from 'vitest';
import { nextRotation, placementFor, rotatedSize } from './rotation';

describe('rotation', () => {
  it('cycles 0 → 90 → 180 → 270 → 0', () => {
    expect(nextRotation(0)).toBe(90);
    expect(nextRotation(90)).toBe(180);
    expect(nextRotation(180)).toBe(270);
    expect(nextRotation(270)).toBe(0);
  });
  it('swaps width and height for quarter turns', () => {
    expect(rotatedSize(400, 300, 0)).toEqual({ width: 400, height: 300 });
    expect(rotatedSize(400, 300, 90)).toEqual({ width: 300, height: 400 });
    expect(rotatedSize(400, 300, 180)).toEqual({ width: 400, height: 300 });
    expect(rotatedSize(400, 300, 270)).toEqual({ width: 300, height: 400 });
  });
  it('places the rotated image so it fills a page of the rotated size', () => {
    // pdf-lib rotates counter-clockwise about the drawn image's bottom-left corner
    expect(placementFor(400, 300, 0)).toEqual({ x: 0, y: 0, degrees: 0 });
    expect(placementFor(400, 300, 90)).toEqual({ x: 0, y: 400, degrees: -90 });
    expect(placementFor(400, 300, 180)).toEqual({ x: 400, y: 300, degrees: 180 });
    expect(placementFor(400, 300, 270)).toEqual({ x: 300, y: 0, degrees: 90 });
  });
});
