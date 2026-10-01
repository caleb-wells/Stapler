import { describe, expect, it } from 'vitest';
import { mapWithConcurrency } from './concurrency';

describe('mapWithConcurrency', () => {
  it('never runs more than the limit at once and preserves order', async () => {
    let active = 0;
    let peak = 0;
    const result = await mapWithConcurrency([5, 1, 3, 2, 4], 2, async (n) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, n * 5));
      active -= 1;
      return n * 10;
    });
    expect(result).toEqual([50, 10, 30, 20, 40]);
    expect(peak).toBe(2);
  });
  it('handles an empty list', async () => {
    expect(await mapWithConcurrency([], 3, async (x: number) => x)).toEqual([]);
  });
});
