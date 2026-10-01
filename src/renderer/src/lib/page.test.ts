import { describe, expect, it } from 'vitest';
import { pageSizeFor } from './page';

describe('pageSizeFor', () => {
  it('converts pixels at 96 DPI to points', () => {
    expect(pageSizeFor(96, 96)).toEqual({ width: 72, height: 72 });
    expect(pageSizeFor(1920, 1080)).toEqual({ width: 1440, height: 810 });
  });
  it('keeps fractional points for odd sizes', () => {
    expect(pageSizeFor(1, 1)).toEqual({ width: 0.75, height: 0.75 });
  });
  it('rejects non-positive dimensions', () => {
    expect(() => pageSizeFor(0, 10)).toThrow(/positive/);
    expect(() => pageSizeFor(10, -1)).toThrow(/positive/);
  });
});
