import { describe, expect, it } from 'vitest';
import { getHeifDecoder } from './heif';

describe('getHeifDecoder', () => {
  it('returns one shared decoder instance so each decode frees the previous context', async () => {
    const a = await getHeifDecoder();
    const b = await getHeifDecoder();
    expect(a).toBe(b);
    expect(typeof a.decode).toBe('function');
  });
});
