import { describe, expect, it } from 'vitest';
import { outputEncodingFor } from './encoding';

describe('outputEncodingFor', () => {
  it('passes JPEG through when orientation is upright or missing', () => {
    expect(outputEncodingFor('jpeg', undefined)).toEqual({ kind: 'jpeg', passthrough: true });
    expect(outputEncodingFor('jpeg', 1)).toEqual({ kind: 'jpeg', passthrough: true });
  });
  it('re-encodes rotated JPEGs at quality 0.92', () => {
    expect(outputEncodingFor('jpeg', 6)).toEqual({ kind: 'jpeg', passthrough: false, quality: 0.92 });
  });
  it('passes PNG through', () => {
    expect(outputEncodingFor('png', undefined)).toEqual({ kind: 'png', passthrough: true });
  });
  it('uses lossless PNG for GIF and BMP', () => {
    expect(outputEncodingFor('gif', undefined)).toEqual({ kind: 'png', passthrough: false });
    expect(outputEncodingFor('bmp', undefined)).toEqual({ kind: 'png', passthrough: false });
  });
  it('uses JPEG 0.9 for WebP, TIFF and HEIC', () => {
    for (const f of ['webp', 'tiff', 'heic'] as const) {
      expect(outputEncodingFor(f, undefined)).toEqual({ kind: 'jpeg', passthrough: false, quality: 0.9 });
    }
  });
});
